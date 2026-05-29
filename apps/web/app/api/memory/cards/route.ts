import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';

export async function GET(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { searchParams } = new URL(req.url);
        const deckId = searchParams.get('deck_id');
        const due = searchParams.get('due');

        let query = supabase
            .from('memory_cards')
            .select(
                'id,user_id,deck_id,front,back,status,due_date,interval_days,ease,repetitions,created_at',
            )
            .eq('user_id', userId)
            .order('due_date', { ascending: true })
            .limit(200);

        if (deckId) query = query.eq('deck_id', deckId);
        if (due === 'true')
            query = query.lte('due_date', new Date().toISOString());

        const { data, error } = await query;
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
            deck_id: string;
            front: string;
            back: string;
        };
        const { data, error } = await supabase
            .from('memory_cards')
            .insert({
                user_id: userId,
                deck_id: body.deck_id,
                front: body.front,
                back: body.back,
            })
            .select(
                'id,user_id,deck_id,front,back,status,due_date,interval_days,ease,repetitions,created_at',
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
