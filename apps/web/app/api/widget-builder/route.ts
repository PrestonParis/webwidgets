import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';

const createSchema = z.object({
    name: z.string().min(1).max(60),
    description: z.string().max(500).optional().default(''),
    category: z.string().default('custom'),
    icon: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    definition: z.record(z.string(), z.unknown()),
    status: z.enum(['draft', 'published']).default('draft'),
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
        .from('custom_widgets')
        .select(
            'id, name, description, category, icon, status, tags, version, created_at, updated_at',
        )
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ widgets: data });
}

export async function POST(request: Request) {
    const { supabase } = await createClients();
    let userId: string;
    try {
        userId = await getRequestUserId(supabase);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = createSchema.safeParse(await request.json());
    if (!body.success)
        return NextResponse.json(
            { error: body.error.flatten() },
            { status: 400 },
        );
    const { data, error } = await supabase
        .from('custom_widgets')
        .insert({ user_id: userId, ...body.data })
        .select()
        .single();
    if (error)
        return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ widget: data }, { status: 201 });
}
