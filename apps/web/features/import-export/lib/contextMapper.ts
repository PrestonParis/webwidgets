import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import type { ImportExportAdapter } from './adapterInterface';
import { toText } from './coerce';
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

// A known source type, or any other adapter-supplied string. The `& {}` keeps
// literal autocomplete while still accepting arbitrary strings.
type SourceTypeKey = SourceDestinationType | (string & {});

const mappers = new Map<SourceTypeKey, AdapterContextMapper>();

export function registerContextMapper(
    sourceType: SourceTypeKey,
    mapper: AdapterContextMapper,
): void {
    mappers.set(sourceType, mapper);
}

export function getContextMapper(
    sourceType: SourceTypeKey,
): AdapterContextMapper | undefined {
    return mappers.get(sourceType);
}

export async function ingestContextFromAdapterPayload(
    db: SupabaseClient<Database>,
    userId: string,
    sourceType: SourceTypeKey,
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
    db: SupabaseClient<Database>,
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
    const data = row.data;
    const text = toText(data.text ?? data.title ?? 'Untitled task');
    const id = toText(data.id ?? slugSourceId(text, row.rowIndex));
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
    const data = row.data;
    const id = toText(
        data.id ?? slugSourceId(toText(data.name ?? 'file'), row.rowIndex),
    );
    const name = toText(data.name ?? 'Uploaded file');
    return {
        nodes: [
            {
                entityId: `file:${id}`,
                type: 'file',
                label: name,
                summary: toText(data.mime_type ?? ''),
                data,
                tags: ['file', toText(data.mime_type ?? '')].filter(Boolean),
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
    const data = row.data;
    const id = toText(
        data.id ?? slugSourceId(toText(data.title ?? 'event'), row.rowIndex),
    );
    const title = toText(data.title ?? 'Calendar event');
    return {
        nodes: [
            {
                entityId: `calendar_event:${id}`,
                type: 'calendar_event',
                label: title,
                summary: toText(data.description ?? ''),
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
    const data = row.data;
    const id = toText(
        data.id ?? slugSourceId(toText(data.title ?? 'document'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `document:${id}`,
                type: 'document',
                label: toText(data.title ?? 'Document'),
                summary: toText(data.content ?? '').slice(0, 280),
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
                          toEntityId: `file:${toText(data.source_file_id)}`,
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
                          toEntityId: `artifact:${toText(data.source_artifact_id)}`,
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
    const data = row.data;
    const id = toText(
        data.id ?? slugSourceId(toText(data.title ?? 'journal'), row.rowIndex),
    );
    const type = toText(data.type ?? 'journal');
    return {
        nodes: [
            {
                entityId: `${type === 'note' ? 'memory' : 'journal_entry'}:${id}`,
                type: type === 'note' ? 'memory' : 'journal_entry',
                label: toText(data.title ?? 'Journal entry'),
                summary: toText(data.content ?? '').slice(0, 280),
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
    const data = row.data;
    const id = toText(data.id ?? data.logged_date ?? row.rowIndex);
    const label = `Mood ${toText(data.mood ?? '')}`.trim();
    return {
        nodes: [
            {
                entityId: `mood_entry:${id}`,
                type: 'mood_entry',
                label,
                summary: toText(data.note ?? '').slice(0, 220),
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
    const data = row.data;
    const id = toText(
        data.id ?? slugSourceId(toText(data.name ?? 'habit'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `habit_entry:${id}`,
                type: 'habit_entry',
                label: toText(data.name ?? 'Habit'),
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
    const data = row.data;
    const id = toText(
        data.id ?? slugSourceId(toText(data.name ?? 'recovery'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `recovery_entry:${id}`,
                type: 'recovery_entry',
                label: toText(data.name ?? data.category ?? 'Recovery tracker'),
                summary: toText(data.category ?? data.addiction ?? '').slice(
                    0,
                    220,
                ),
                data: {
                    category: data.category,
                    startTime: data.start_time,
                    createdAt: data.created_at,
                },
                tags: ['recovery', toText(data.category ?? '')].filter(Boolean),
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
    const data = row.data;
    const recordType = toText(data.record_type ?? 'finance');
    const id = toText(data.id ?? slugSourceId(recordType, row.rowIndex));
    const isAccount = recordType === 'account';
    return {
        nodes: [
            {
                entityId: `finance:${recordType}:${id}`,
                type: isAccount ? 'insight' : 'widget_activity',
                label: isAccount
                    ? `Finance account: ${toText(data.name ?? 'Account')}`
                    : `Finance activity: ${toText(data.category ?? data.transaction_type ?? 'transaction')}`,
                summary: isAccount
                    ? `Account type ${toText(data.type ?? '')}`
                    : `Transaction category ${toText(data.category ?? '')}`,
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
                          toEntityId: `finance:account:${toText(data.account_id)}`,
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
    const data = row.data;
    const id = toText(
        data.id ?? slugSourceId(toText(data.name ?? 'countdown'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `todo:countdown:${id}`,
                type: 'todo',
                label: toText(data.name ?? 'Countdown'),
                summary: `Target date ${toText(data.target_date ?? '')}`,
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
    const data = row.data;
    const id = toText(
        data.id ?? slugSourceId(toText(data.title ?? 'deck'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `memory:${id}`,
                type: 'memory',
                label: toText(data.title ?? 'Memory deck'),
                summary: toText(
                    data.description ??
                        `Due cards: ${toText(data.due_count) || 0}`,
                ),
                data: {
                    domain: data.domain,
                    status: data.status,
                    cardCount: data.card_count,
                    dueCount: data.due_count,
                    masteredCount: data.mastered_count,
                },
                tags: ['memorization', toText(data.domain ?? '')].filter(
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
    const data = row.data;
    const id = toText(
        data.id ?? slugSourceId(toText(data.title ?? 'handoff'), row.rowIndex),
    );
    return {
        nodes: [
            {
                entityId: `agent_action:handoff:${id}`,
                type: 'agent_action',
                label: toText(data.title ?? 'Collaboration handoff'),
                summary: `Priority ${toText(data.priority ?? '')} due ${toText(data.due ?? '')}`,
                data,
                tags: [
                    'collaboration',
                    'handoff',
                    toText(data.priority ?? ''),
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
                      toEntityId: `project:workspace:${toText(data.workspace_id)}`,
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
    const data = row.data;
    const id = toText(data.id ?? slugSourceId('tracking-entry', row.rowIndex));
    const category = toText(data.category ?? 'tracking');
    const date = toText(data.entry_date ?? data.logged_at ?? '');
    return {
        nodes: [
            {
                entityId: `widget_activity:tracking:${id}`,
                type: 'widget_activity',
                label: `${category} tracking${date ? ` · ${date}` : ''}`,
                summary: toText(data.notes ?? '').slice(0, 220),
                data: {
                    category,
                    entryDate: data.entry_date,
                    loggedAt: data.logged_at,
                    source: data.source,
                    tags: data.tags,
                },
                tags: ['tracking', category, toText(data.source ?? '')].filter(
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
    const data = row.data;
    const id = toText(data.id ?? slugSourceId('activity-event', row.rowIndex));
    const source = toText(data.source ?? 'platform');
    const eventType = toText(data.event_type ?? 'activity');
    const sourceId = toText(data.source_id ?? '');
    const sourceTable = toText(data.source_table ?? '');
    const node = {
        entityId: `agent_action:activity:${id}`,
        type: 'agent_action' as const,
        label: toText(data.title ?? eventType),
        summary: toText(data.body ?? '').slice(0, 240),
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
