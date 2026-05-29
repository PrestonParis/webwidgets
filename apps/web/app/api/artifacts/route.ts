import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    listArtifacts,
    createArtifact,
} from '@/features/artifacts/services/artifactService';
import type { ArtifactType } from '@/features/artifacts/types/artifact';

export async function GET(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type') as ArtifactType | null;
        const limit = parseInt(searchParams.get('limit') ?? '100', 10);

        const data = await listArtifacts(supabase, userId, {
            limit,
            ...(type ? { type } : {}),
        });
        return NextResponse.json({ data });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err)) return NextResponse.json({ data: [] });
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}

export async function POST(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const body = (await req.json()) as {
            type?: ArtifactType;
            title?: string;
            content?: string;
            contentFormat?: 'markdown' | 'json' | 'plain_text';
            sourceFileId?: string;
            sourceDocumentId?: string;
            sourceJobId?: string;
            tags?: string[];
        };

        const artifact = await createArtifact(supabase, userId, {
            type: body.type ?? 'other',
            title: body.title ?? 'Untitled',
            content: body.content ?? '',
            ...(body.contentFormat !== undefined
                ? { contentFormat: body.contentFormat }
                : {}),
            ...(body.sourceFileId !== undefined
                ? { sourceFileId: body.sourceFileId }
                : {}),
            ...(body.sourceDocumentId !== undefined
                ? { sourceDocumentId: body.sourceDocumentId }
                : {}),
            ...(body.sourceJobId !== undefined
                ? { sourceJobId: body.sourceJobId }
                : {}),
            tags: body.tags ?? [],
        });

        return NextResponse.json({ data: artifact }, { status: 201 });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json(
                { error: 'TABLE_NOT_FOUND' },
                { status: 503 },
            );
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
