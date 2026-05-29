import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { logActivity } from '@/features/collaboration/lib/activityLogger';

function generateToken(): string {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return Array.from(arr)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

async function isEditorOrOwner(
    supabase: Awaited<ReturnType<typeof createClients>>['supabase'],
    workspaceId: string,
    userId: string,
): Promise<boolean> {
    const { data: ws } = await supabase
        .from('collaboration_workspaces')
        .select('user_id')
        .eq('id', workspaceId)
        .single();
    if (ws?.user_id === userId) return true;
    const { data: m } = await supabase
        .from('workspace_members')
        .select('role')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    return m?.role === 'editor';
}

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        if (!(await isEditorOrOwner(supabase, id, userId)))
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const { data, error } = await supabase
            .from('workspace_invites')
            .select(
                'id,workspace_id,inviter_id,email,role,token,status,expires_at,created_at',
            )
            .eq('workspace_id', id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (error) {
            if (isMissingTableError(error)) return NextResponse.json([]);
            throw error;
        }
        return NextResponse.json(data ?? []);
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        if (!(await isEditorOrOwner(supabase, id, userId)))
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const body = (await req.json()) as { email: string; role?: string };
        if (!body.email?.includes('@'))
            return NextResponse.json(
                { error: 'Invalid email' },
                { status: 400 },
            );
        const role = body.role === 'editor' ? 'editor' : 'viewer';
        const token = generateToken();

        const { data, error } = await supabase
            .from('workspace_invites')
            .insert({
                workspace_id: id,
                inviter_id: userId,
                email: body.email.toLowerCase().trim(),
                role,
                token,
            })
            .select()
            .single();
        if (error) {
            if (
                error.message?.includes('duplicate') ||
                error.code === '23505'
            ) {
                return NextResponse.json(
                    { error: 'A pending invite already exists for this email' },
                    { status: 409 },
                );
            }
            throw error;
        }
        await logActivity(supabase, {
            workspaceId: id,
            actorId: userId,
            action: 'member_invited',
            targetType: 'invite',
            targetId: data.id,
            metadata: { email: body.email, role },
        });
        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
