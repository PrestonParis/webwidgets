import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    getArtifact,
    updateArtifact,
    archiveArtifact,
} from '@/features/artifacts/services/artifactService';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const artifact = await getArtifact(supabase, userId, id);
        if (!artifact)
            return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

        return NextResponse.json({ data: artifact });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const body = (await req.json()) as {
            title?: string;
            content?: string;
            contentFormat?: 'markdown' | 'json' | 'plain_text';
            tags?: string[];
            metadata?: Record<string, unknown>;
        };

        const artifact = await updateArtifact(supabase, userId, id, body);
        return NextResponse.json({ data: artifact });
    } catch (err) {
        if (err instanceof Error && err.message === 'UNAUTHORIZED')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        await archiveArtifact(supabase, userId, id);
        return new Response(null, { status: 204 });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
