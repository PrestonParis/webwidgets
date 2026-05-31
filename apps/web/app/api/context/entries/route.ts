import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import {
    listEntries,
    ingestContextNode,
    ingestContextNodes,
} from '@/features/context/services/contextService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UpsertEntryPayload } from '@/features/context/types/context';
import {
    contextNodeInputSchema,
    contextNodeTypes,
} from '@/features/context/types/schemas';

const entrySchema = z.object({
    entityId: z.string().min(1),
    entryType: z.enum(contextNodeTypes),
    label: z.string().min(1),
    summary: z.string().nullable().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
    tags: z.array(z.string()).optional(),
    sourceType: z.string().optional(),
    sourceId: z.string().nullable().optional(),
    sourceTable: z.string().nullable().optional(),
    sourceCollection: z.string().nullable().optional(),
    createdBy: z.string().nullable().optional(),
    createdByType: z
        .enum(['user', 'system', 'agent', 'integration'])
        .optional(),
    confidence: z.number().min(0).max(1).optional(),
    status: z.enum(['active', 'archived', 'stale', 'deleted']).optional(),
    visibility: z.string().optional(),
    permissions: z.array(z.string()).optional(),
    lastVerifiedAt: z.string().nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    linkedTo: z.array(z.string()).optional(),
});

export async function GET() {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const entries = await listEntries(
            supabase as unknown as SupabaseClient,
            userId,
        );
        return NextResponse.json({ entries });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 401 });
    }
}

export async function POST(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = entrySchema.safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const legacy = body.data as unknown as UpsertEntryPayload;
        const canonical = contextNodeInputSchema.parse({
            entityId: legacy.entityId,
            type: legacy.entryType,
            label: legacy.label,
            summary: legacy.summary,
            data: legacy.data,
            tags: legacy.tags,
            sourceType: legacy.sourceType,
            sourceId: legacy.sourceId,
            sourceTable: legacy.sourceTable,
            sourceCollection: legacy.sourceCollection,
            createdBy: legacy.createdBy,
            createdByType: legacy.createdByType,
            confidence: legacy.confidence,
            status: legacy.status,
            visibility: legacy.visibility,
            permissions: legacy.permissions,
            lastVerifiedAt: legacy.lastVerifiedAt,
            metadata: legacy.metadata,
        });
        const entry = await ingestContextNode(
            supabase as unknown as SupabaseClient,
            userId,
            canonical,
        );
        return NextResponse.json({ entry });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);
        const body = z
            .object({ entries: z.array(entrySchema) })
            .safeParse(await req.json());
        if (!body.success)
            return NextResponse.json(
                { error: 'Invalid payload' },
                { status: 400 },
            );
        const nodes = (
            body.data.entries as unknown as UpsertEntryPayload[]
        ).map((entry) =>
            contextNodeInputSchema.parse({
                entityId: entry.entityId,
                type: entry.entryType,
                label: entry.label,
                summary: entry.summary,
                data: entry.data,
                tags: entry.tags,
                sourceType: entry.sourceType,
                sourceId: entry.sourceId,
                sourceTable: entry.sourceTable,
                sourceCollection: entry.sourceCollection,
                createdBy: entry.createdBy,
                createdByType: entry.createdByType,
                confidence: entry.confidence,
                status: entry.status,
                visibility: entry.visibility,
                permissions: entry.permissions,
                lastVerifiedAt: entry.lastVerifiedAt,
                metadata: entry.metadata,
            }),
        );
        await ingestContextNodes(
            supabase as unknown as SupabaseClient,
            userId,
            nodes,
        );
        return NextResponse.json({ ok: true });
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
