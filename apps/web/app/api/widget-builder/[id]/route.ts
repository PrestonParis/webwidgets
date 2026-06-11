import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';

const updateSchema = z.object({
    name: z.string().min(1).max(60).optional(),
    description: z.string().max(500).optional(),
    category: z.string().optional(),
    icon: z.string().optional(),
    tags: z.array(z.string()).optional(),
    definition: z.record(z.string(), z.unknown()).optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
});

export async function GET(
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
    const { data, error } = await supabase
        .from('custom_widgets')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
    if (error || !data)
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ widget: data });
}

export async function PUT(
    request: Request,
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
    const body = updateSchema.safeParse(await request.json());
    if (!body.success)
        return NextResponse.json(
            { error: body.error.flatten() },
            { status: 400 },
        );
    const { data, error } = await supabase
        .from('custom_widgets')
        .update(body.data)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ widget: data });
}

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
        .from('custom_widgets')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return new Response(null, { status: 204 });
}
