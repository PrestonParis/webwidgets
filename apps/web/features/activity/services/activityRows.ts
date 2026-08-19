import type {
    ActivityEvent,
    ActivityEventCategory,
    ActivityEventPriority,
    ActivityEventSeverity,
    ActivityEventSource,
    ActivityEventOrigin,
    RelatedEntity,
} from '@/features/activity/types/activity';

export type ActivityEventRow = {
    id: string;
    user_id: string;
    source: string;
    event_type?: string | null;
    source_id?: string | null;
    source_table?: string | null;
    severity?: string | null;
    priority?: string | null;
    category?: string | null;
    title: string;
    body?: string | null;
    is_archived?: boolean | null;
    read_at?: string | null;
    occurred_at?: string | null;
    created_at?: string | null;
    related_entities?: unknown;
    metadata?: Record<string, unknown> | null;
    action_url?: string | null;
    origin?: string | null;
};

export function mapActivityRow(row: ActivityEventRow): ActivityEvent {
    const now = new Date().toISOString();
    return {
        id: row.id,
        userId: row.user_id,
        source: row.source as ActivityEventSource,
        ...(row.event_type ? { eventType: row.event_type } : {}),
        ...(row.source_id ? { sourceId: row.source_id } : {}),
        ...(row.source_table ? { sourceTable: row.source_table } : {}),
        severity: (row.severity as ActivityEventSeverity) ?? 'info',
        priority: (row.priority as ActivityEventPriority) ?? 'normal',
        category: (row.category as ActivityEventCategory) ?? 'system',
        title: row.title,
        ...(row.body ? { body: row.body } : {}),
        isArchived: row.is_archived ?? false,
        ...(row.read_at ? { readAt: row.read_at } : {}),
        occurredAt: row.occurred_at ?? row.created_at ?? now,
        createdAt: row.created_at ?? now,
        relatedEntities: Array.isArray(row.related_entities)
            ? (row.related_entities as RelatedEntity[])
            : [],
        metadata: row.metadata ?? {},
        ...(row.action_url ? { actionUrl: row.action_url } : {}),
        origin: (row.origin as ActivityEventOrigin) ?? 'domain',
    };
}
