import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/services/requestUser';

const defaults = {
    high_contrast: false,
    reduce_motion: false,
    persistent_focus: true,
    density: 50,
    transcription_first: false,
    reader_comfort: false,
    keyboard_mode: false,
    low_cognitive_load: false,
};

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { data } = (await supabase
            .from('accessibility_settings')
            .select('*')
            .eq('user_id', userId)
            .single()) as {
            data: Record<string, unknown> | null;
            error: unknown;
        };
        return NextResponse.json(data ?? { user_id: userId, ...defaults });
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

export async function PUT(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = (await req.json()) as Record<string, unknown>;
        const { data, error } = (await supabase
            .from('accessibility_settings')
            .upsert({
                user_id: userId,
                ...body,
                updated_at: new Date().toISOString(),
            })
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
