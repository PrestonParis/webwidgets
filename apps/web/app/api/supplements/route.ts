import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import type { CreateSupplementPayload } from '@/features/tracking/types/supplement';

export async function GET() {
    try {
        const { supabase } = await createClients();
        const user = await getUserOrThrow(supabase);
        const { data, error } = await supabase
            .from('supplements')
            .select('*')
            .eq('user_id', user.id)
            .eq('active', true)
            .order('created_at', { ascending: true });
        // 42P01 = undefined_table — migration not yet applied, return empty gracefully
        if (error?.code === '42P01')
            return NextResponse.json({ supplements: [] });
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ supplements: data ?? [] });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const user = await getUserOrThrow(supabase);
        const body = (await req.json()) as CreateSupplementPayload;
        const { data, error } = (await supabase
            .from('supplements')
            .insert({
                user_id: user.id,
                name: body.name,
                dose: body.dose ?? null,
                schedule_type: body.scheduleType,
                schedule_start: body.scheduleStart,
                schedule_end: body.scheduleEnd ?? null,
            })
            .select()
            .single()) as {
            data: Record<string, unknown> | null;
            error: { message: string; code?: string } | null;
        };
        if (error?.code === '42P01')
            return NextResponse.json(
                { error: 'supplements table not ready, run migrations first' },
                { status: 503 },
            );
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ supplement: data });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { supabase } = await createClients();
        const user = await getUserOrThrow(supabase);
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id)
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        const { error } = await supabase
            .from('supplements')
            .update({ active: false })
            .eq('id', id)
            .eq('user_id', user.id);
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
