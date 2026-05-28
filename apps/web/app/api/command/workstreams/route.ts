import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { data, error } = await supabase
            .from('command_workstreams')
            .select(
                'id,user_id,title,domain,owner,status,priority,progress,next_step,due,blockers,automations,confidence,created_at',
            )
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(75);
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
            title: string;
            domain?: string;
            owner?: string;
            status?: string;
            priority?: string;
            next_step?: string;
            due?: string;
        };
        const { data, error } = await supabase
            .from('command_workstreams')
            .insert({
                user_id: userId,
                title: body.title,
                domain: body.domain ?? 'General',
                owner: body.owner ?? null,
                status: body.status ?? 'queued',
                priority: body.priority ?? 'medium',
                next_step: body.next_step ?? null,
                due: body.due ?? null,
            })
            .select(
                'id,user_id,title,domain,owner,status,priority,progress,next_step,due,blockers,automations,confidence,created_at',
            )
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
