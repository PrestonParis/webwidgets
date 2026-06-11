import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const { supabase } = await createClients();
    let userId: string;
    try {
        userId = await getRequestUserId(supabase);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await supabase
        .from('fitness_workout_routines')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return new Response(null, { status: 204 });
}
