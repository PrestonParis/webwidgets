import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';

type Difficulty = 'again' | 'hard' | 'medium' | 'easy';

function nextIntervalDays(current: number, difficulty: Difficulty): number {
    if (difficulty === 'again') return 1;
    if (difficulty === 'hard') return current + 1;
    if (difficulty === 'medium') return current + 3;
    return current + 7;
}

function nextStatus(difficulty: Difficulty): string {
    if (difficulty === 'again') return 'learning';
    if (difficulty === 'easy') return 'mastered';
    return 'review';
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        const body = (await req.json()) as { grade?: Difficulty } & Record<
            string,
            unknown
        >;

        let updates: Record<string, unknown> = { ...body };

        if (body.grade) {
            const { data: card } = await supabase
                .from('memory_cards')
                .select('interval_days')
                .eq('id', id)
                .eq('user_id', userId)
                .single();

            if (card) {
                const intervalDays = nextIntervalDays(
                    card.interval_days as number,
                    body.grade,
                );
                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + intervalDays);
                updates = {
                    status: nextStatus(body.grade),
                    interval_days: intervalDays,
                    due_date: dueDate.toISOString(),
                };
            }
            delete updates.grade;
        }

        const { data, error } = (await supabase
            .from('memory_cards')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single()) as {
            data: Record<string, unknown> | null;
            error: Error | null;
        };
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
