import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    listDocuments,
    createDocument,
} from '@/features/documents/services/documentService';

export async function GET(req: Request): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') ?? '100', 10);

        const data = await listDocuments(supabase, userId, { limit });
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
            title?: string;
            content?: string;
            format?: 'markdown' | 'plain_text' | 'rich_text' | 'json';
            sourceFileId?: string;
            tags?: string[];
        };

        const doc = await createDocument(supabase, userId, {
            title: body.title ?? 'Untitled',
            content: body.content ?? '',
            ...(body.format !== undefined ? { format: body.format } : {}),
            ...(body.sourceFileId !== undefined
                ? { sourceFileId: body.sourceFileId }
                : {}),
            tags: body.tags ?? [],
        });

        return NextResponse.json({ data: doc }, { status: 201 });
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
