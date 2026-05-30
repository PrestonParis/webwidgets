import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    getDocument,
    updateDocument,
    archiveDocument,
} from '@/features/documents/services/documentService';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(
    _req: Request,
    { params }: RouteParams,
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const doc = await getDocument(supabase, userId, id);
        if (!doc)
            return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

        return NextResponse.json({ data: doc });
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
    { params }: RouteParams,
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        const body = (await req.json()) as {
            title?: string;
            content?: string;
            format?: 'markdown' | 'plain_text' | 'rich_text' | 'json';
            tags?: string[];
            metadata?: Record<string, unknown>;
        };

        const doc = await updateDocument(supabase, userId, id, body);

        await publishActivityEventSafe(supabase, {
            userId,
            source: 'document',
            eventType: 'document.updated',
            sourceId: id,
            sourceTable: 'documents',
            category: 'content',
            severity: 'info',
            priority: 'low',
            title: `Document updated: ${doc.title}`,
            actionUrl: `/documents/${id}`,
            relatedEntities: [{ type: 'document', id, label: doc.title }],
            metadata: { changedFields: Object.keys(body) },
        });

        return NextResponse.json({ data: doc });
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

export async function DELETE(
    _req: Request,
    { params }: RouteParams,
): Promise<Response> {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const { id } = await params;

        // Fetch title before archiving for the activity event
        const existing = await getDocument(supabase, userId, id);
        await archiveDocument(supabase, userId, id);

        await publishActivityEventSafe(supabase, {
            userId,
            source: 'document',
            eventType: 'document.archived',
            sourceId: id,
            sourceTable: 'documents',
            category: 'content',
            severity: 'info',
            priority: 'low',
            title: `Document archived: ${existing?.title ?? 'Untitled'}`,
            metadata: { documentId: id },
        });

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
