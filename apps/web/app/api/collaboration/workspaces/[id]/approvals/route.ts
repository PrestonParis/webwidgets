import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { logActivity } from '@/features/collaboration/lib/activityLogger';

import type { SupabaseClient } from '@supabase/supabase-js';

async function isMember(
    supabase: SupabaseClient,
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
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    return !!m;
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        if (!(await isMember(supabase, id, userId)))
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const { data, error } = await supabase
            .from('workspace_approvals')
            .select('*')
            .eq('workspace_id', id)
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
        if (!(await isMember(supabase, id, userId)))
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        const body = (await req.json()) as {
            title: string;
            description?: string;
            handoff_id?: string;
        };
        if (!body.title?.trim())
            return NextResponse.json(
                { error: 'Title required' },
                { status: 400 },
            );
        const { data, error } = await supabase
            .from('workspace_approvals')
            .insert({
                workspace_id: id,
                requester_id: userId,
                title: body.title,
                description: body.description ?? null,
                handoff_id: body.handoff_id ?? null,
            })
            .select()
            .single();
        if (error) throw error;
        await logActivity(supabase, {
            workspaceId: id,
            actorId: userId,
            action: 'approval_requested',
            targetType: 'approval',
            targetId: data.id,
            metadata: { title: body.title },
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
