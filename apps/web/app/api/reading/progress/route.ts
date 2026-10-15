import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import type { ReadingPosition } from '@/features/reading/types/positions';
import type { ReadingProgress } from '@/features/reading/types/plans';
import type { Json } from '@/types/supabase';

function rowToProgress(r: Record<string, unknown>): ReadingProgress {
    return {
        id: r.id as string,
        userId: r.user_id as string,
        documentId: r.document_id as string,
        lastPosition: r.position as ReadingPosition,
        percentComplete: r.percent_complete as number,
        timeSpentMinutes: r.time_spent_minutes as number,
        lastReadAt: r.updated_at as string,
        updatedAt: r.updated_at as string,
        ...(r.version_id !== null &&
            r.version_id !== undefined && {
                versionId: r.version_id as string,
            }),
        ...(r.completed_at !== null &&
            r.completed_at !== undefined && {
                completedAt: r.completed_at as string,
            }),
    };
}

export async function GET(req: Request) {
    try {
        const { supabase } = await createClients();
        const user = await getUserOrThrow(supabase);
        const { searchParams } = new URL(req.url);
        const documentId = searchParams.get('documentId');
        if (!documentId)
            return NextResponse.json(
                { error: 'Missing documentId' },
                { status: 400 },
            );

        const { data, error } = (await supabase
            .from('reading_positions')
            .select('*')
            .eq('user_id', user.id)
            .eq('document_id', documentId)
            .maybeSingle()) as {
            data: Record<string, unknown> | null;
            error: Error | null;
        };

        if ((error as { code?: string })?.code === '42P01')
            return NextResponse.json(null);
        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(data ? rowToProgress(data) : null);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const user = await getUserOrThrow(supabase);
        const body = (await req.json()) as {
            documentId: string;
            position: ReadingPosition;
            percentComplete: number;
            versionId?: string;
        };

        const { data, error } = (await supabase
            .from('reading_positions')
            .upsert(
                {
                    user_id: user.id,
                    document_id: body.documentId,
                    position: body.position as unknown as Json,
                    percent_complete: body.percentComplete,
                    updated_at: new Date().toISOString(),
                    ...(body.versionId !== undefined && {
                        version_id: body.versionId,
                    }),
                },
                { onConflict: 'user_id,document_id' },
            )
            .select()
            .single()) as {
            data: Record<string, unknown> | null;
            error: Error | null;
        };

        if (error)
            return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json(
            rowToProgress(data as Record<string, unknown>),
        );
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
