import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { data, error } = await supabase
            .from('collaboration_workspaces')
            .select('id,user_id,name,scope,description,status,created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        if (error) {
            if (isMissingTableError(error)) return NextResponse.json([]);
            throw error;
        }
        return NextResponse.json(data ?? []);
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = (await req.json()) as {
            name: string;
            scope?: string;
            description?: string;
            status?: string;
        };
        const { data, error } = await supabase
            .from('collaboration_workspaces')
            .insert({
                user_id: userId,
                name: body.name,
                scope: body.scope ?? 'General',
                description: body.description ?? null,
                status: body.status ?? 'live',
            })
            .select('id,user_id,name,scope,description,status,created_at')
            .single();
        if (error) throw error;
        return NextResponse.json(data, { status: 201 });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 },
            );
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 },
        );
    }
}
