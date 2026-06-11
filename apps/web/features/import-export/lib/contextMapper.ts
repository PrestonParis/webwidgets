import type { SupabaseClient } from '@supabase/supabase-js';
import type { ImportExportAdapter } from './adapterInterface';
import type { MappedRow, SourceDestinationType } from '../types/importExport';
import {
    ingestContextEdges,
    ingestContextNodes,
} from '@/features/context/services/contextService';
import type {
    CanonicalContextEdgeInput,
    CanonicalContextNodeInput,
} from '@/features/context/types/schemas';

export interface AdapterContextMapping {
    nodes: CanonicalContextNodeInput[];
    edges?: CanonicalContextEdgeInput[];
}

export type AdapterContextMapper = (
    row: MappedRow,
) => AdapterContextMapping | null;

const mappers = new Map<SourceDestinationType | string, AdapterContextMapper>();

export function registerContextMapper(
    sourceType: SourceDestinationType | string,
    mapper: AdapterContextMapper,
): void {
    mappers.set(sourceType, mapper);
}

export function getContextMapper(
    sourceType: SourceDestinationType | string,
): AdapterContextMapper | undefined {
    return mappers.get(sourceType);
}

export async function ingestContextFromAdapterPayload(
    db: SupabaseClient,
    userId: string,
    sourceType: SourceDestinationType | string,
    rows: MappedRow[],
): Promise<{ nodeCount: number; edgeCount: number }> {
    const mapper = getContextMapper(sourceType);
    if (!mapper) return { nodeCount: 0, edgeCount: 0 };
    const mapped = rows.map(mapper).filter(Boolean) as AdapterContextMapping[];
    const nodes = mapped.flatMap((item) => item.nodes);
    const edges = mapped.flatMap((item) => item.edges ?? []);
    const persistedNodes = await ingestContextNodes(db, userId, nodes);
    const persistedEdges = await ingestContextEdges(db, userId, edges);
    return {
        nodeCount: persistedNodes.length,
        edgeCount: persistedEdges.length,
    };
}

export async function ingestContextFromAdapter(
    db: SupabaseClient,
    userId: string,
    adapter: ImportExportAdapter,
    options?: { limit?: number },
): Promise<{ nodeCount: number; edgeCount: number }> {
    if (!adapter.exportData) return { nodeCount: 0, edgeCount: 0 };
    const payload = await adapter.exportData(userId, options);
    return ingestContextFromAdapterPayload(
        db,
        userId,
        adapter.sourceType,
        payload.rows,
    );
}

registerContextMapper('todos', (row) => {
    const data = row.data as Record<string, unknown>;
    const text = String(data.text ?? data.title ?? 'Untitled task');
    const id = String(data.id ?? slugSourceId(text, row.rowIndex));
    return {
        nodes: [
            {
                entityId: `todo:${id}`,
                type: 'todo',
                label: text,
                summary: text,
                data: {
                    completed: data.completed ?? data.done ?? false,
                    completedAt: data.completed_at,
                },
                tags: ['todo'],
                sourceType: 'todos',
                sourceId: id,
                sourceTable: 'todos',
                createdByType: 'user',
                permissions: ['private', 'ai', 'cross_widget'],
            },
        ],
    };
});

registerContextMapper('files', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(
        data.id ?? slugSourceId(String(data.name ?? 'file'), row.rowIndex),
    );
    const name = String(data.name ?? 'Uploaded file');
    return {
        nodes: [
            {
                entityId: `file:${id}`,
                type: 'file',
                label: name,
                summary: String(data.mime_type ?? ''),
                data,
                tags: ['file', String(data.mime_type ?? '')].filter(Boolean),
                sourceType: 'files',
                sourceId: id,
                sourceTable: 'file_uploads',
                createdByType: 'user',
                permissions: ['private', 'ai', 'cross_widget'],
            },
        ],
    };
});

registerContextMapper('calendar_events', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(
        data.id ?? slugSourceId(String(data.title ?? 'event'), row.rowIndex),
    );
    const title = String(data.title ?? 'Calendar event');
    return {
        nodes: [
            {
                entityId: `calendar_event:${id}`,
                type: 'calendar_event',
                label: title,
                summary: String(data.description ?? ''),
                data,
                tags: ['calendar'],
                sourceType: 'calendar_events',
                sourceId: id,
                sourceTable: 'calendar_events',
                createdByType: 'integration',
                permissions: ['private', 'ai', 'cross_widget'],
            },
        ],
    };
});

registerContextMapper('documents', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(
        data.id ?? slugSourceId(String(data.title ?? 'document'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `document:${id}`,
                type: 'document',
                label: String(data.title ?? 'Document'),
                summary: String(data.content ?? '').slice(0, 280),
                data: {
                    format: data.format,
                    sourceFileId: data.source_file_id,
                    sourceArtifactId: data.source_artifact_id,
                    createdAt: data.created_at,
                    updatedAt: data.updated_at,
                },
                tags: ['document'],
                sourceType: 'documents',
                sourceId: id,
                sourceTable: 'documents',
                createdByType: 'user',
                permissions: ['private', 'ai', 'cross_widget'],
            },
        ],
        edges: [
            ...(data.source_file_id
                ? [
                      {
                          fromEntityId: `document:${id}`,
                          toEntityId: `file:${String(data.source_file_id)}`,
                          kind: 'derived_from' as const,
                          label: 'document from file',
                          sourceType: 'documents',
                          sourceId: id,
                          createdByType: 'system' as const,
                      },
                  ]
                : []),
            ...(data.source_artifact_id
                ? [
                      {
                          fromEntityId: `document:${id}`,
                          toEntityId: `artifact:${String(data.source_artifact_id)}`,
                          kind: 'derived_from' as const,
                          label: 'document from artifact',
                          sourceType: 'documents',
                          sourceId: id,
                          createdByType: 'system' as const,
                      },
                  ]
                : []),
        ],
    };
});

registerContextMapper('journals', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(
        data.id ?? slugSourceId(String(data.title ?? 'journal'), row.rowIndex),
    );
    const type = String(data.type ?? 'journal');
    return {
        nodes: [
            {
                entityId: `${type === 'note' ? 'memory' : 'journal_entry'}:${id}`,
                type: type === 'note' ? 'memory' : 'journal_entry',
                label: String(data.title ?? 'Journal entry'),
                summary: String(data.content ?? '').slice(0, 280),
                data: {
                    entryType: type,
                    createdAt: data.created_at,
                },
                tags: ['journal', type],
                sourceType: 'journals',
                sourceId: id,
                sourceTable: 'journals',
                createdByType: 'user',
                permissions: ['private', 'ai'],
            },
        ],
    };
});

registerContextMapper('mood_logs', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(data.id ?? data.logged_date ?? row.rowIndex);
    const label = `Mood ${String(data.mood ?? '')}`.trim();
    return {
        nodes: [
            {
                entityId: `mood_entry:${id}`,
                type: 'mood_entry',
                label,
                summary: String(data.note ?? '').slice(0, 220),
                data: {
                    mood: data.mood,
                    loggedDate: data.logged_date,
                    loggedAt: data.logged_at,
                },
                tags: ['mood'],
                sourceType: 'mood_logs',
                sourceId: id,
                sourceTable: 'mood_logs',
                createdByType: 'user',
                permissions: ['private', 'ai'],
            },
        ],
    };
});

registerContextMapper('habits', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(
        data.id ?? slugSourceId(String(data.name ?? 'habit'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `habit_entry:${id}`,
                type: 'habit_entry',
                label: String(data.name ?? 'Habit'),
                summary: `${Number(data.completions_last_30d ?? 0)} completions in last 30 days`,
                data: {
                    emoji: data.emoji,
                    completionsLast30d: data.completions_last_30d,
                    createdAt: data.created_at,
                },
                tags: ['habit'],
                sourceType: 'habits',
                sourceId: id,
                sourceTable: 'habits',
                createdByType: 'user',
                permissions: ['private', 'ai', 'cross_widget'],
            },
        ],
    };
});

registerContextMapper('recovery_records', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(
        data.id ?? slugSourceId(String(data.name ?? 'recovery'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `recovery_entry:${id}`,
                type: 'recovery_entry',
                label: String(data.name ?? data.category ?? 'Recovery tracker'),
                summary: String(data.category ?? data.addiction ?? '').slice(
                    0,
                    220,
                ),
                data: {
                    category: data.category,
                    startTime: data.start_time,
                    createdAt: data.created_at,
                },
                tags: ['recovery', String(data.category ?? '')].filter(Boolean),
                sourceType: 'recovery_records',
                sourceId: id,
                sourceTable: 'recovery_profiles',
                createdByType: 'user',
                permissions: ['private', 'ai'],
            },
        ],
    };
});

registerContextMapper('finance_records', (row) => {
    const data = row.data as Record<string, unknown>;
    const recordType = String(data.record_type ?? 'finance');
    const id = String(data.id ?? slugSourceId(recordType, row.rowIndex));
    const isAccount = recordType === 'account';
    return {
        nodes: [
            {
                entityId: `finance:${recordType}:${id}`,
                type: isAccount ? 'insight' : 'widget_activity',
                label: isAccount
                    ? `Finance account: ${String(data.name ?? 'Account')}`
                    : `Finance activity: ${String(data.category ?? data.transaction_type ?? 'transaction')}`,
                summary: isAccount
                    ? `Account type ${String(data.type ?? '')}`
                    : `Transaction category ${String(data.category ?? '')}`,
                data: {
                    recordType,
                    currency: data.currency,
                    category: data.category,
                    transactionType: data.transaction_type,
                    date: data.date,
                },
                tags: ['finance', recordType],
                sourceType: 'finance_records',
                sourceId: id,
                sourceTable: isAccount
                    ? 'finance_accounts'
                    : 'finance_transactions',
                createdByType: 'user',
                permissions: ['private'],
            },
        ],
        edges:
            !isAccount && data.account_id
                ? [
                      {
                          fromEntityId: `finance:transaction:${id}`,
                          toEntityId: `finance:account:${String(data.account_id)}`,
                          kind: 'belongs_to' as const,
                          label: 'transaction account',
                          sourceType: 'finance_records',
                          sourceId: id,
                          createdByType: 'system' as const,
                      },
                  ]
                : [],
    };
});

registerContextMapper('countdowns', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(
        data.id ?? slugSourceId(String(data.name ?? 'countdown'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `todo:countdown:${id}`,
                type: 'todo',
                label: String(data.name ?? 'Countdown'),
                summary: `Target date ${String(data.target_date ?? '')}`,
                data,
                tags: ['countdown'],
                sourceType: 'countdowns',
                sourceId: id,
                sourceTable: 'countdowns',
                createdByType: 'user',
                permissions: ['private', 'ai', 'cross_widget'],
            },
        ],
    };
});

registerContextMapper('memory_decks', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(
        data.id ?? slugSourceId(String(data.title ?? 'deck'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `memory:${id}`,
                type: 'memory',
                label: String(data.title ?? 'Memory deck'),
                summary: String(
                    data.description ?? `Due cards: ${data.due_count ?? 0}`,
                ),
                data: {
                    domain: data.domain,
                    status: data.status,
                    cardCount: data.card_count,
                    dueCount: data.due_count,
                    masteredCount: data.mastered_count,
                },
                tags: ['memorization', String(data.domain ?? '')].filter(
                    Boolean,
                ),
                sourceType: 'memory_decks',
                sourceId: id,
                sourceTable: 'memory_decks',
                createdByType: 'user',
                permissions: ['private', 'ai', 'cross_widget'],
            },
        ],
    };
});

registerContextMapper('collaboration_handoffs', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(
        data.id ?? slugSourceId(String(data.title ?? 'handoff'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `agent_action:handoff:${id}`,
                type: 'agent_action',
                label: String(data.title ?? 'Collaboration handoff'),
                summary: `Priority ${String(data.priority ?? '')} due ${String(data.due ?? '')}`,
                data,
                tags: [
                    'collaboration',
                    'handoff',
                    String(data.priority ?? ''),
                ].filter(Boolean),
                sourceType: 'collaboration_handoffs',
                sourceId: id,
                sourceTable: 'collaboration_handoffs',
                createdByType: 'user',
                permissions: ['private', 'ai', 'cross_widget'],
            },
        ],
        edges: data.workspace_id
            ? [
                  {
                      fromEntityId: `agent_action:handoff:${id}`,
                      toEntityId: `project:workspace:${String(data.workspace_id)}`,
                      kind: 'belongs_to' as const,
                      label: 'workspace handoff',
                      sourceType: 'collaboration_handoffs',
                      sourceId: id,
                      createdByType: 'system' as const,
                  },
              ]
            : [],
    };
});

registerContextMapper('tracking_entries', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(data.id ?? slugSourceId('tracking-entry', row.rowIndex));
    const category = String(data.category ?? 'tracking');
    const date = String(data.entry_date ?? data.logged_at ?? '');
    return {
        nodes: [
            {
                entityId: `widget_activity:tracking:${id}`,
                type: 'widget_activity',
                label: `${category} tracking${date ? ` · ${date}` : ''}`,
                summary: String(data.notes ?? '').slice(0, 220),
                data: {
                    category,
                    entryDate: data.entry_date,
                    loggedAt: data.logged_at,
                    source: data.source,
                    tags: data.tags,
                },
                tags: ['tracking', category, String(data.source ?? '')].filter(
                    Boolean,
                ),
                sourceType: 'tracking_entries',
                sourceId: id,
                sourceTable: 'tracking_entries',
                createdByType: 'user',
                permissions: ['private', 'ai', 'cross_widget'],
            },
        ],
    };
});

registerContextMapper('activity_events', (row) => {
    const data = row.data as Record<string, unknown>;
    const id = String(data.id ?? slugSourceId('activity-event', row.rowIndex));
    const source = String(data.source ?? 'platform');
    const eventType = String(data.event_type ?? 'activity');
    const sourceId = String(data.source_id ?? '');
    const sourceTable = String(data.source_table ?? '');
    const node = {
        entityId: `agent_action:activity:${id}`,
        type: 'agent_action' as const,
        label: String(data.title ?? eventType),
        summary: String(data.body ?? '').slice(0, 240),
        data: {
            source,
            eventType,
            category: data.category,
            priority: data.priority,
            severity: data.severity,
            occurredAt: data.occurred_at,
            actionUrl: data.action_url,
        },
        tags: ['activity', source, eventType].filter(Boolean),
        sourceType: 'activity_events',
        sourceId: id,
        sourceTable: 'activity_events',
        createdByType: 'system' as const,
        permissions: [
            'private' as const,
            'ai' as const,
            'cross_widget' as const,
        ],
    };
    const edges =
        sourceId && sourceTable
            ? [
                  {
                      fromEntityId: node.entityId,
                      toEntityId: `${sourceTable}:${sourceId}`,
                      kind: 'relates_to' as const,
                      label: 'activity references source record',
                      sourceType: 'activity_events',
                      sourceId: id,
                      createdByType: 'system' as const,
                      confidence: 0.8,
                  },
              ]
            : [];
    return { nodes: [node], edges };
});

function slugSourceId(value: string, rowIndex: number): string {
    const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80);
    return `${slug || 'row'}:${rowIndex}`;
}
