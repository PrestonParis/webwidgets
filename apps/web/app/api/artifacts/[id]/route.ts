import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    getArtifact,
    updateArtifact,
    archiveArtifact,
} from '@/features/artifacts/services/artifactService';
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
    { params }: RouteParams,
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

        await publishActivityEventSafe(supabase, {
            userId,
            source: 'artifact',
            eventType: 'artifact.updated',
            sourceId: id,
            sourceTable: 'artifacts',
            category: 'ai',
            severity: 'info',
            priority: 'low',
            title: `Artifact updated: ${artifact.title}`,
            actionUrl: `/artifacts/${id}`,
            relatedEntities: [{ type: 'artifact', id, label: artifact.title }],
            metadata: {
                artifactType: artifact.type,
                changedFields: Object.keys(body),
            },
        });

        return NextResponse.json({ data: artifact });
    } catch (err) {
        if (
            err instanceof Error &&
            (err.message === 'UNAUTHORIZED' || err.message === 'Unauthorized')
        )
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

        const existing = await getArtifact(supabase, userId, id);
        await archiveArtifact(supabase, userId, id);

        await publishActivityEventSafe(supabase, {
            userId,
            source: 'artifact',
            eventType: 'artifact.archived',
            sourceId: id,
            sourceTable: 'artifacts',
            category: 'ai',
            severity: 'info',
            priority: 'low',
            title: `Artifact archived: ${existing?.title ?? 'Untitled'}`,
            metadata: { artifactId: id, artifactType: existing?.type },
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
