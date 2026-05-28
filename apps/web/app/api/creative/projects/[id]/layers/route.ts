import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        const { data, error } = await supabase
            .from('creative_layers')
            .select('*')
            .eq('project_id', id)
            .eq('user_id', userId)
            .order('layer_order', { ascending: true });
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

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;
        const body = (await req.json()) as {
            name: string;
            layer_type?: string;
            x?: number;
            y?: number;
            width?: number;
            height?: number;
            color?: string;
            layer_order?: number;
        };
        const { data, error } = (await supabase
            .from('creative_layers')
            .insert({
                user_id: userId,
                project_id: id,
                name: body.name,
                layer_type: body.layer_type ?? 'shape',
                x: body.x ?? 0,
                y: body.y ?? 0,
                width: body.width ?? 200,
                height: body.height ?? 100,
                color: body.color ?? '#e5e7eb',
                layer_order: body.layer_order ?? 0,
            })
            .select()
            .single()) as {
            data: Record<string, unknown> | null;
            error: Error | null;
        };
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
