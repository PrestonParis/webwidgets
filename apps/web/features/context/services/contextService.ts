import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    ContextEntry,
    ContextEdge,
    ContextEntryRow,
    UpsertEntryPayload,
} from '@/features/context/types/context';
import { rowToEntry } from '@/features/context/types/context';
import {
    contextEdgeInputSchema,
    contextNodeInputSchema,
    type CanonicalContextEdgeInput,
    type CanonicalContextNodeInput,
} from '@/features/context/types/schemas';
import {
    captureCategoryForSource,
    getContextPermissions,
    permissionAllowsCapture,
} from './contextPermissionsService';
import { isMissingTableError } from '@/lib/supabase/missingTable';

const ENTRY_SELECT =
    'id,user_id,entity_id,entry_type,label,data,linked_to,summary,tags,source_type,source_id,source_table,source_collection,created_by,created_by_type,confidence,status,visibility,permissions,last_observed_at,last_verified_at,metadata,created_at,updated_at';
const LEGACY_ENTRY_SELECT =
    'id,user_id,entity_id,entry_type,label,data,linked_to,created_at,updated_at';
const EDGE_SELECT =
    'id,user_id,from_entity_id,to_entity_id,kind,label,weight,confidence,created_by,created_by_type,source_type,source_id,metadata,created_at,updated_at';
const LEGACY_EDGE_SELECT =
    'id,user_id,from_entity_id,to_entity_id,kind,created_at,updated_at';

export async function listEntries(
    db: SupabaseClient,
    userId: string,
    options?: { limit?: number },
): Promise<ContextEntry[]> {
    const limit = options?.limit ?? 1000;
    const { data, error } = await db
        .from('context_entries')
        .select(ENTRY_SELECT)
        .eq('user_id', userId)
        .neq('status', 'deleted')
        .order('created_at', { ascending: true })
        .limit(limit);
    if (error) {
        if (isMissingTableError(error)) return [];
        if (isSchemaDriftError(error)) {
            return listLegacyEntries(db, userId, limit);
        }
        throw new Error(error.message);
    }
    return ((data ?? []) as unknown as ContextEntryRow[])
        .map(rowToEntry)
        .filter((entry) => !isContextDiagramSelfEntry(entry));
}

async function listLegacyEntries(
    db: SupabaseClient,
    userId: string,
    limit: number,
): Promise<ContextEntry[]> {
    const { data, error } = await db
        .from('context_entries')
        .select(LEGACY_ENTRY_SELECT)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(limit);
    if (error) {
        if (isMissingTableError(error)) return [];
        throw new Error(error.message);
    }
    return ((data ?? []) as unknown as ContextEntryRow[])
        .map((row) =>
            rowToEntry({
                ...row,
                data: row.data ?? {},
                linked_to: row.linked_to ?? [],
                status: 'active',
                visibility: 'private',
                permissions: ['private'],
                metadata: {},
            }),
        )
        .filter((entry) => !isContextDiagramSelfEntry(entry));
}

export async function upsertEntry(
    db: SupabaseClient,
    userId: string,
    payload: UpsertEntryPayload,
): Promise<ContextEntry> {
    const now = new Date().toISOString();
    const record = {
        user_id: userId,
        entity_id: payload.entityId,
        entry_type: payload.entryType,
        label: payload.label,
        summary: payload.summary,
        data: payload.data ?? {},
        tags: payload.tags ?? [],
        source_type: payload.sourceType ?? 'manual',
        source_id: payload.sourceId,
        source_table: payload.sourceTable,
        source_collection: payload.sourceCollection,
        created_by: payload.createdBy ?? userId,
        created_by_type: payload.createdByType ?? 'user',
        confidence: payload.confidence ?? 1,
        status: payload.status ?? 'active',
        visibility: payload.visibility ?? 'private',
        permissions: payload.permissions ?? ['private'],
        last_observed_at: now,
        last_verified_at: payload.lastVerifiedAt,
        metadata: payload.metadata ?? {},
        linked_to: payload.linkedTo ?? [],
        updated_at: now,
    };
    const { data, error } = await db
        .from('context_entries')
        .upsert(record, { onConflict: 'user_id,entity_id' })
        .select(ENTRY_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return rowToEntry(data as unknown as ContextEntryRow);
}

export async function batchUpsertEntries(
    db: SupabaseClient,
    userId: string,
    payloads: UpsertEntryPayload[],
): Promise<void> {
    if (payloads.length === 0) return;
    const now = new Date().toISOString();
    const records = payloads.map((p) => ({
        user_id: userId,
        entity_id: p.entityId,
        entry_type: p.entryType,
        label: p.label,
        summary: p.summary,
        data: p.data ?? {},
        tags: p.tags ?? [],
        source_type: p.sourceType ?? 'manual',
        source_id: p.sourceId,
        source_table: p.sourceTable,
        source_collection: p.sourceCollection,
        created_by: p.createdBy ?? userId,
        created_by_type: p.createdByType ?? 'user',
        confidence: p.confidence ?? 1,
        status: p.status ?? 'active',
        visibility: p.visibility ?? 'private',
        permissions: p.permissions ?? ['private'],
        last_observed_at: now,
        last_verified_at: p.lastVerifiedAt,
        metadata: p.metadata ?? {},
        linked_to: p.linkedTo ?? [],
        updated_at: now,
    }));
    const { error } = await db
        .from('context_entries')
        .upsert(records, { onConflict: 'user_id,entity_id' });
    if (error) throw new Error(error.message);
}

export async function deleteEntry(
    db: SupabaseClient,
    userId: string,
    entityId: string,
): Promise<void> {
    const { error } = await db
        .from('context_entries')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('entity_id', entityId);
    if (error) throw new Error(error.message);
}

export function edgeRowToEdge(row: Record<string, any>): ContextEdge {
    return {
        id: row.id,
        from: row.from_entity_id,
        to: row.to_entity_id,
        kind: row.kind,
        label: row.label ?? undefined,
        weight: Number(row.weight ?? 1),
        confidence: Number(row.confidence ?? 1),
        sourceType: row.source_type,
        sourceId: row.source_id,
        createdBy: row.created_by,
        createdByType: row.created_by_type,
        metadata: row.metadata ?? {},
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function listEdges(
    db: SupabaseClient,
    userId: string,
    filters?: {
        fromEntityId?: string;
        toEntityId?: string;
        kinds?: string[];
        minConfidence?: number;
    },
): Promise<ContextEdge[]> {
    let query = (db as any)
        .from('context_edges')
        .select(EDGE_SELECT)
        .eq('user_id', userId);
    if (filters?.fromEntityId)
        query = query.eq('from_entity_id', filters.fromEntityId);
    if (filters?.toEntityId)
        query = query.eq('to_entity_id', filters.toEntityId);
    if (filters?.kinds?.length) query = query.in('kind', filters.kinds);
    if (filters?.minConfidence !== undefined)
        query = query.gte('confidence', filters.minConfidence);
    const { data, error } = await query.order('updated_at', {
        ascending: false,
    });
    if (error) {
        if (isMissingTableError(error)) return [];
        if (isSchemaDriftError(error)) {
            return listLegacyEdges(db, userId, filters);
        }
        throw new Error(error.message);
    }
    return ((data ?? []) as Record<string, any>[]).map(edgeRowToEdge);
}

async function listLegacyEdges(
    db: SupabaseClient,
    userId: string,
    filters?: {
        fromEntityId?: string;
        toEntityId?: string;
        kinds?: string[];
        minConfidence?: number;
    },
): Promise<ContextEdge[]> {
    let query = (db as any)
        .from('context_edges')
        .select(LEGACY_EDGE_SELECT)
        .eq('user_id', userId);
    if (filters?.fromEntityId)
        query = query.eq('from_entity_id', filters.fromEntityId);
    if (filters?.toEntityId)
        query = query.eq('to_entity_id', filters.toEntityId);
    if (filters?.kinds?.length) query = query.in('kind', filters.kinds);
    const { data, error } = await query.order('updated_at', {
        ascending: false,
    });
    if (error) {
        if (isMissingTableError(error)) return [];
        throw new Error(error.message);
    }
    return ((data ?? []) as Record<string, any>[]).map((row) =>
        edgeRowToEdge({
            ...row,
            label: null,
            weight: 1,
            confidence: 1,
            source_type: 'legacy',
            source_id: null,
            metadata: {},
        }),
    );
}

export async function deleteContextEdge(
    db: SupabaseClient,
    userId: string,
    edgeId: string,
): Promise<boolean> {
    const { data, error: readError } = await (db as any)
        .from('context_edges')
        .select('id,kind')
        .eq('user_id', userId)
        .eq('id', edgeId)
        .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!data) return false;
    if (data.kind !== 'explicit') {
        throw new Error('Only explicit edges can be deleted');
    }
    const { error } = await (db as any)
        .from('context_edges')
        .delete()
        .eq('user_id', userId)
        .eq('id', edgeId);
    if (error) throw new Error(error.message);
    return true;
}

export async function ingestContextNode(
    db: SupabaseClient,
    userId: string,
    input: CanonicalContextNodeInput,
): Promise<ContextEntry | null> {
    const parsed = contextNodeInputSchema.parse(input);
    const permissions = await getContextPermissions(db, userId);
    const category = captureCategoryForSource(parsed.sourceType);
    if (!permissionAllowsCapture(permissions, category)) return null;
    return upsertEntry(db, userId, {
        entityId: normalizeEntityId(parsed.entityId),
        entryType: parsed.type,
        label: parsed.label,
        summary: parsed.summary,
        data: parsed.data,
        tags: parsed.tags,
        sourceType: parsed.sourceType,
        sourceId: parsed.sourceId,
        sourceTable: parsed.sourceTable,
        sourceCollection: parsed.sourceCollection,
        createdBy: parsed.createdBy ?? userId,
        createdByType: parsed.createdByType,
        confidence: parsed.confidence ?? 1,
        status: parsed.status,
        visibility: parsed.visibility,
        permissions: parsed.permissions,
        lastVerifiedAt: parsed.lastVerifiedAt,
        metadata: parsed.metadata,
        linkedTo: [],
    });
}

export async function ingestContextNodes(
    db: SupabaseClient,
    userId: string,
    inputs: CanonicalContextNodeInput[],
): Promise<ContextEntry[]> {
    const results = await Promise.all(
        inputs.map((input) => ingestContextNode(db, userId, input)),
    );
    return results.filter(Boolean) as ContextEntry[];
}

export async function ingestContextEdge(
    db: SupabaseClient,
    userId: string,
    input: CanonicalContextEdgeInput,
): Promise<ContextEdge | null> {
    const parsed = contextEdgeInputSchema.parse(input);
    if (parsed.fromEntityId === parsed.toEntityId) return null;
    const permissions = await getContextPermissions(db, userId);
    if ((parsed.confidence ?? 1) < 1 && !permissions.allowInferredRelationships)
        return null;
    const now = new Date().toISOString();
    const sourceId =
        parsed.sourceId ??
        `${parsed.sourceType}:${parsed.fromEntityId}:${parsed.toEntityId}:${parsed.kind}`;
    const { data, error } = await (db as any)
        .from('context_edges')
        .upsert(
            {
                user_id: userId,
                from_entity_id: normalizeEntityId(parsed.fromEntityId),
                to_entity_id: normalizeEntityId(parsed.toEntityId),
                kind: parsed.kind,
                label: parsed.label,
                weight: parsed.weight,
                confidence: parsed.confidence,
                created_by: parsed.createdBy ?? userId,
                created_by_type: parsed.createdByType,
                source_type: parsed.sourceType,
                source_id: sourceId,
                metadata: parsed.metadata,
                updated_at: now,
            },
            {
                onConflict:
                    'user_id,from_entity_id,to_entity_id,kind,source_type,source_id',
            },
        )
        .select(EDGE_SELECT)
        .single();
    if (error) throw new Error(error.message);
    return edgeRowToEdge(data);
}

export async function ingestContextEdges(
    db: SupabaseClient,
    userId: string,
    inputs: CanonicalContextEdgeInput[],
): Promise<ContextEdge[]> {
    const results = await Promise.all(
        inputs.map((input) => ingestContextEdge(db, userId, input)),
    );
    return results.filter(Boolean) as ContextEdge[];
}

export async function upsertContextFromSource(
    db: SupabaseClient,
    userId: string,
    sourceType: string,
    sourceId: string,
    node: Omit<CanonicalContextNodeInput, 'sourceType' | 'sourceId'>,
): Promise<ContextEntry | null> {
    return ingestContextNode(db, userId, {
        ...node,
        sourceType,
        sourceId,
        entityId: node.entityId || `${sourceType}:${sourceId}`,
    });
}

export async function archiveContextFromSource(
    db: SupabaseClient,
    userId: string,
    sourceType: string,
    sourceId: string,
): Promise<void> {
    const { error } = await (db as any)
        .from('context_entries')
        .update({ status: 'archived', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('source_type', sourceType)
        .eq('source_id', sourceId);
    if (error) throw new Error(error.message);
}

export async function markContextStale(
    db: SupabaseClient,
    userId: string,
    entityId: string,
): Promise<void> {
    const { error } = await (db as any)
        .from('context_entries')
        .update({ status: 'stale', updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('entity_id', normalizeEntityId(entityId));
    if (error) throw new Error(error.message);
}

export async function linkContextEntities(
    db: SupabaseClient,
    userId: string,
    fromEntityId: string,
    toEntityId: string,
    kind: CanonicalContextEdgeInput['kind'],
    metadata?: Record<string, unknown>,
): Promise<ContextEdge | null> {
    return ingestContextEdge(db, userId, {
        fromEntityId,
        toEntityId,
        kind,
        label: kind.replaceAll('_', ' '),
        metadata: metadata ?? {},
        sourceType: 'manual',
        createdByType: 'user',
    });
}

export async function archiveEntry(
    db: SupabaseClient,
    userId: string,
    entityId: string,
): Promise<void> {
    await markContextStatus(db, userId, entityId, 'archived');
}

export async function markContextStatus(
    db: SupabaseClient,
    userId: string,
    entityId: string,
    status: 'active' | 'archived' | 'stale' | 'deleted',
): Promise<void> {
    const { error } = await (db as any)
        .from('context_entries')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('entity_id', normalizeEntityId(entityId));
    if (error) throw new Error(error.message);
}

export function normalizeEntityId(entityId: string): string {
    return entityId.trim().replace(/\s+/g, '-').toLowerCase();
}

function isSchemaDriftError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const maybe = error as { code?: string; message?: string };
    const message = maybe.message?.toLowerCase() ?? '';
    return (
        maybe.code === '42703' ||
        maybe.code === 'PGRST204' ||
        message.includes('column') ||
        message.includes('schema cache')
    );
}

function isContextDiagramSelfEntry(entry: ContextEntry): boolean {
    if (entry.entryType !== 'widget') return false;
    const widgetType =
        typeof entry.data.widgetType === 'string'
            ? entry.data.widgetType
            : undefined;
    return (
        entry.entityId === 'widget-context-diagram' ||
        entry.entityId === 'widget:context-diagram' ||
        entry.sourceId === 'context-diagram' ||
        widgetType === 'context-diagram'
    );
}
