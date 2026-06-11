import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';

const routineSchema = z.object({
    name: z.string().min(1).max(100),
    description: z.string().optional(),
    exercises: z
        .array(
            z.object({
                name: z.string(),
                sets: z.number().optional(),
                reps: z.number().optional(),
                weight: z.number().optional(),
                unit: z.enum(['kg', 'lbs', 'bodyweight']).optional(),
                notes: z.string().optional(),
            }),
        )
        .default([]),
    tags: z.array(z.string()).default([]),
    duration_minutes: z.number().optional(),
});

export async function GET() {
    const { supabase } = await createClients();
    let userId: string;
    try {
        userId = await getRequestUserId(supabase);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('fitness_workout_routines')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ routines: data ?? [] });
}

export async function POST(request: Request) {
    const { supabase } = await createClients();
    let userId: string;
    try {
        userId = await getRequestUserId(supabase);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = routineSchema.safeParse(await request.json());
    if (!body.success)
        return NextResponse.json(
            { error: body.error.flatten() },
            { status: 400 },
        );

    const { data, error } = await supabase
        .from('fitness_workout_routines')
        .insert({ user_id: userId, ...body.data })
        .select()
        .single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ routine: data }, { status: 201 });
}
