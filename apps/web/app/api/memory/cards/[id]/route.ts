import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { applyGrade } from '@/features/memorization/lib/sm2';
import type { MemoryDifficulty } from '@/features/memorization/types/memorization';

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        const body = (await req.json()) as {
            grade?: MemoryDifficulty;
        } & Record<string, unknown>;

        let updates: Record<string, unknown> = { ...body };

        if (body.grade) {
            const { data: card } = await supabase
                .from('memory_cards')
                .select('interval_days,ease,repetitions')
                .eq('id', id)
                .eq('user_id', userId)
                .single();

            if (card) {
                const result = applyGrade(
                    {
                        interval_days: (card.interval_days as number) ?? 1,
                        ease: (card.ease as number) ?? 2.5,
                        repetitions: (card.repetitions as number) ?? 0,
                    },
                    body.grade,
                );
                updates = {
                    status: result.status,
                    interval_days: result.interval_days,
                    ease: result.ease,
                    repetitions: result.repetitions,
                    due_date: result.due_date,
                };
            }
            delete updates.grade;
        }

        const { data, error } = await supabase
            .from('memory_cards')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select(
                'id,user_id,deck_id,front,back,status,due_date,interval_days,ease,repetitions,created_at',
            )
            .single();
        if (error) throw error;
        return NextResponse.json(data);
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

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        const { error } = await supabase
            .from('memory_cards')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);
        if (error) throw error;
        return new NextResponse(null, { status: 204 });
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
