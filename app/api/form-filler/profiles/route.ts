import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import type { FormFillerProfile } from '@/features/form-filler/types';

type QueryResult<T> = { data: T | null; error: { message: string } | null };

export async function GET(): Promise<Response> {
    const { supabase } = await createClients();
    const user = await getUserOrThrow(supabase);

    const { data, error } = await supabase
        .from('form_filler_profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function POST(req: Request): Promise<Response> {
    const { supabase } = await createClients();
    const user = await getUserOrThrow(supabase);

    const body = (await req.json()) as {
        name?: string;
        fields?: Record<string, string>;
    };
    const { data, error } = (await supabase
        .from('form_filler_profiles')
        .insert({
            user_id: user.id,
            name: body.name ?? 'Default',
            fields: body.fields ?? {},
        })
        .select()
        .single()) as unknown as QueryResult<FormFillerProfile>;

    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request): Promise<Response> {
    const { supabase } = await createClients();
    const user = await getUserOrThrow(supabase);

    const body = (await req.json()) as {
        id: string;
        name?: string;
        fields?: Record<string, string>;
    };
    const { data, error } = (await supabase
        .from('form_filler_profiles')
        .update({
            name: body.name,
            fields: body.fields,
            updated_at: new Date().toISOString(),
        })
        .eq('id', body.id)
        .eq('user_id', user.id)
        .select()
        .single()) as unknown as QueryResult<FormFillerProfile>;

    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
}

export async function DELETE(req: Request): Promise<Response> {
    const { supabase } = await createClients();
    const user = await getUserOrThrow(supabase);

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase
        .from('form_filler_profiles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
