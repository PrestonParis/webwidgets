import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
    contextEdgeInputSchema,
    contextNodeInputSchema,
} from '@/features/context/types/schemas';
import {
    deleteContextEdge,
    ingestContextEdge,
    ingestContextNode,
} from '@/features/context/services/contextService';
import { getContextNeighborhood } from '@/features/context/services/contextTraversalService';
import { buildContextBundle } from '@/features/context/services/contextBundleService';
import { buildContextGraph } from '@/features/context/lib/graphBuilder';
import {
    ingestArtifactContext,
    ingestAutomationRunContext,
    ingestCalendarEventContext,
    ingestEmailActionCalendarContext,
    ingestEmailActionTodoContext,
    ingestExtractionContext,
    ingestFileUploadContext,
    ingestJournalContext,
} from '@/features/context/services/contextProducerService';
import { ingestContextFromAdapterPayload } from '@/features/import-export/lib/contextMapper';
import { backfillContextRowsForSource } from '@/features/context/services/contextBackfillService';
import { getRuntimeContextCoverageReport } from '@/features/context/services/contextCoverageService';
import {
    CONTEXT_COVERAGE_REGISTRY,
    getContextCoverageSummary,
} from '@/features/context/lib/contextCoverageRegistry';
import { getAllManifests } from '@/features/dashboard/runtime/widgetManifestRegistry';
import { widgetManifestSchema } from '@/features/dashboard/runtime/widgetManifest';
import { FILE_AI_ACTIONS } from '@/features/uploads/lib/fileAiActionOptions';

type Row = Record<string, any>;

class FakeQuery {
    private filters: Array<(row: Row) => boolean> = [];
    private limitCount?: number;
    private singleMode: 'single' | 'maybe' | null = null;
    private orderColumn?: string;
    private updatePayload?: Row;
    private upsertRows?: Row[];

    constructor(
        private rows: Row[],
        private table: string,
        private db: FakeDb,
    ) {}

    select() {
        return this;
    }
    eq(key: string, value: unknown) {
        this.filters.push((row) => row[key] === value);
        return this;
    }
    neq(key: string, value: unknown) {
        this.filters.push((row) => row[key] !== value);
        return this;
    }
    gte(key: string, value: number) {
        this.filters.push((row) => Number(row[key] ?? 0) >= value);
        return this;
    }
    in(key: string, values: unknown[]) {
        this.filters.push((row) => values.includes(row[key]));
        return this;
    }
    order(column: string) {
        this.orderColumn = column;
        return this;
    }
    limit(count: number) {
        this.limitCount = count;
        return this;
    }
    single() {
        this.singleMode = 'single';
        return this;
    }
    maybeSingle() {
        this.singleMode = 'maybe';
        return this;
    }
    upsert(rows: Row | Row[]) {
        const inputRows = Array.isArray(rows) ? rows : [rows];
        this.upsertRows = inputRows.map((row) =>
            this.db.upsert(this.table, row),
        );
        return this;
    }
    update(payload: Row) {
        this.updatePayload = payload;
        return this;
    }
    delete() {
        this.updatePayload = { __delete: true };
        return this;
    }
    then(resolve: (value: { data: any; error: null }) => void) {
        if (this.updatePayload) {
            this.db.update(this.table, this.filters, this.updatePayload);
        }
        let data = this.rows.filter((row) =>
            this.filters.every((filter) => filter(row)),
        );
        if (this.upsertRows) data = this.upsertRows;
        if (this.orderColumn) {
            data = [...data].sort((a, b) =>
                String(b[this.orderColumn!]).localeCompare(
                    String(a[this.orderColumn!]),
                ),
            );
        }
        if (this.limitCount !== undefined)
            data = data.slice(0, this.limitCount);
        resolve({
            data:
                this.singleMode === 'single' || this.singleMode === 'maybe'
                    ? (data[0] ?? null)
                    : data,
            error: null,
        });
    }
}

class FakeDb {
    tables: Record<string, Row[]> = {
        context_entries: [],
        context_edges: [],
        context_permissions: [],
    };
    from(table: string) {
        return new FakeQuery(this.tables[table] ?? [], table, this);
    }
    upsert(table: string, row: Row): Row {
        const rows = (this.tables[table] ??= []);
        const match =
            table === 'context_edges'
                ? rows.findIndex(
                      (item) =>
                          item.user_id === row.user_id &&
                          item.from_entity_id === row.from_entity_id &&
                          item.to_entity_id === row.to_entity_id &&
                          item.kind === row.kind,
                  )
                : rows.findIndex(
                      (item) =>
                          item.user_id === row.user_id &&
                          item.entity_id === row.entity_id,
                  );
        const now = new Date().toISOString();
        const next = {
            id: row.id ?? `${table}-${rows.length + 1}`,
            created_at: now,
            ...row,
        };
        if (match >= 0) rows[match] = { ...rows[match], ...next };
        else rows.push(next);
        return match >= 0 ? rows[match]! : next;
    }
    update(table: string, filters: Array<(row: Row) => boolean>, payload: Row) {
        const rows = this.tables[table] ?? [];
        this.tables[table] = rows.filter((row) => {
            if (!filters.every((filter) => filter(row))) return true;
            if (payload.__delete) return false;
            Object.assign(row, payload);
            return true;
        });
    }
}

describe('context substrate foundation', () => {
    it('keeps the migration aligned with required substrate tables', () => {
        const sql = fs.readFileSync(
            path.join(
                process.cwd(),
                'supabase/migrations/202605300001_context_substrate.sql',
            ),
            'utf8',
        );
        expect(sql).toContain('alter table if exists public.context_entries');
        expect(sql).toContain(
            'create table if not exists public.context_edges',
        );
        expect(sql).toContain(
            'create table if not exists public.context_permissions',
        );
        expect(sql).toContain(
            'create table if not exists public.context_saved_views',
        );
        expect(sql).toContain('enable row level security');
        expect(sql).toContain('context_edges_user_from_idx');
    });

    it('validates canonical node and edge schemas', () => {
        expect(
            contextNodeInputSchema.parse({
                entityId: 'todo:1',
                type: 'todo',
                label: 'Ship context substrate',
            }).type,
        ).toBe('todo');
        expect(
            contextEdgeInputSchema.parse({
                fromEntityId: 'goal:1',
                toEntityId: 'todo:1',
                kind: 'supports_goal',
            }).kind,
        ).toBe('supports_goal');
    });

    it('dedupes node ingestion and creates traversable semantic edges', async () => {
        const db = new FakeDb() as any;
        await ingestContextNode(db, 'user-1', {
            entityId: 'todo:1',
            type: 'todo',
            label: 'First title',
            sourceType: 'todos',
            sourceId: '1',
        });
        await ingestContextNode(db, 'user-1', {
            entityId: 'todo:1',
            type: 'todo',
            label: 'Updated title',
            sourceType: 'todos',
            sourceId: '1',
        });
        await ingestContextNode(db, 'user-1', {
            entityId: 'goal:1',
            type: 'goal',
            label: 'Launch',
        });
        const edge = await ingestContextEdge(db, 'user-1', {
            fromEntityId: 'todo:1',
            toEntityId: 'goal:1',
            kind: 'supports_goal',
        });
        expect(edge?.kind).toBe('supports_goal');
        expect(db.tables.context_entries).toHaveLength(2);

        const graph = await getContextNeighborhood(db, 'user-1', 'todo:1', 1);
        expect(graph.edges.some((item) => item.kind === 'supports_goal')).toBe(
            true,
        );
    });

    it('enforces AI bundle permissions and prefers persisted graph edges', async () => {
        const db = new FakeDb() as any;
        db.tables.context_permissions.push({
            user_id: 'user-1',
            allow_ai_personalization: false,
        });
        const bundle = await buildContextBundle(db, 'user-1', {
            consumer: 'chat',
            query: 'launch',
        });
        expect(bundle.nodes).toHaveLength(0);
        expect(bundle.warnings[0]).toContain('disabled');

        const graph = buildContextGraph(
            [
                {
                    id: '1',
                    userId: 'user-1',
                    entityId: 'a',
                    entryType: 'goal',
                    label: 'A',
                    data: {},
                    linkedTo: [],
                    createdAt: '',
                    updatedAt: '',
                },
                {
                    id: '2',
                    userId: 'user-1',
                    entityId: 'b',
                    entryType: 'todo',
                    label: 'B',
                    data: {},
                    linkedTo: [],
                    createdAt: '',
                    updatedAt: '',
                },
            ],
            [{ from: 'a', to: 'b', kind: 'supports_goal', confidence: 1 }],
        );
        expect(graph.edges[0]?.kind).toBe('supports_goal');
    });

    it('ingests file uploads, extractions, artifacts, and adapter payloads', async () => {
        const db = new FakeDb() as any;
        await ingestFileUploadContext(db, {
            id: 'file-1',
            userId: 'user-1',
            originalName: 'brief.pdf',
            mimeType: 'application/pdf',
            sizeBytes: 2048,
            s3Key: 'private/key/not-in-prompt',
            status: 'uploaded',
            createdAt: '',
            updatedAt: '',
        });
        await ingestExtractionContext(db, 'user-1', {
            fileId: 'file-1',
            fileName: 'brief.pdf',
            extraction: {
                id: 'extract-1',
                userId: 'user-1',
                fileId: 'file-1',
                conversionId: 'conversion-1',
                sourceStoragePath: 'converted/brief.txt',
                extractedText: 'Important extracted text for the workspace.',
                textFormat: 'plain_text',
                characterCount: 43,
                tokenEstimate: 11,
                extractionStatus: 'ready',
                extractionError: null,
                createdAt: '',
                updatedAt: '',
            },
        });
        await ingestArtifactContext(db, {
            id: 'artifact-1',
            userId: 'user-1',
            type: 'cheatsheet',
            title: 'Brief cheatsheet',
            content: 'Summary of the file',
            contentFormat: 'markdown',
            sourceFileId: 'file-1',
            sourceDocumentId: null,
            sourceJobId: 'job-1',
            parentArtifactId: null,
            tags: ['auto-generated'],
            metadata: {},
            createdAt: '',
            updatedAt: '',
            archivedAt: null,
            deletedAt: null,
        });
        const adapterResult = await ingestContextFromAdapterPayload(
            db,
            'user-1',
            'todos',
            [
                {
                    rowIndex: 0,
                    data: {
                        id: 'todo-1',
                        text: 'Review brief',
                        completed: false,
                    },
                },
            ],
        );
        await ingestContextFromAdapterPayload(db, 'user-1', 'files', [
            {
                rowIndex: 1,
                data: {
                    id: 'file-2',
                    name: 'notes.txt',
                    mime_type: 'text/plain',
                    size_bytes: 128,
                },
            },
        ]);
        await ingestContextFromAdapterPayload(db, 'user-1', 'calendar_events', [
            {
                rowIndex: 2,
                data: {
                    id: 'event-1',
                    title: 'Review brief',
                    start: '2026-05-31T10:00:00Z',
                },
            },
        ]);
        await ingestContextFromAdapterPayload(db, 'user-1', 'journals', [
            {
                rowIndex: 3,
                data: {
                    id: 'journal-1',
                    title: 'Reflection',
                    content: 'A short journal entry',
                    type: 'journal',
                },
            },
        ]);
        await ingestContextFromAdapterPayload(db, 'user-1', 'mood_logs', [
            {
                rowIndex: 4,
                data: {
                    id: 'mood-1',
                    mood: 4,
                    logged_date: '2026-05-30',
                },
            },
        ]);
        await ingestContextFromAdapterPayload(db, 'user-1', 'habits', [
            {
                rowIndex: 5,
                data: {
                    id: 'habit-1',
                    name: 'Read',
                    completions_last_30d: 12,
                },
            },
        ]);
        await ingestContextFromAdapterPayload(db, 'user-1', 'memory_decks', [
            {
                rowIndex: 6,
                data: {
                    id: 'deck-1',
                    title: 'Biology',
                    due_count: 3,
                },
            },
        ]);
        await ingestContextFromAdapterPayload(
            db,
            'user-1',
            'collaboration_handoffs',
            [
                {
                    rowIndex: 7,
                    data: {
                        id: 'handoff-1',
                        title: 'Review plan',
                        workspace_id: 'workspace-1',
                    },
                },
            ],
        );
        await ingestContextFromAdapterPayload(db, 'user-1', 'documents', [
            {
                rowIndex: 8,
                data: {
                    id: 'doc-1',
                    title: 'Sleep plan',
                    content: 'Sleep goals and notes',
                    source_file_id: 'file-1',
                    source_artifact_id: 'artifact-1',
                },
            },
        ]);

        expect(adapterResult.nodeCount).toBe(1);
        expect(
            (db.tables.context_entries as Row[]).some(
                (row) => row.entity_id === 'file:file-1',
            ),
        ).toBe(true);
        expect(
            (db.tables.context_edges as Row[]).some(
                (row) => row.kind === 'derived_from',
            ),
        ).toBe(true);
        expect(
            (db.tables.context_entries as Row[]).some(
                (row) => row.entity_id === 'calendar_event:event-1',
            ),
        ).toBe(true);
        expect(
            (db.tables.context_entries as Row[]).some(
                (row) => row.entry_type === 'journal_entry',
            ),
        ).toBe(true);
        expect(
            (db.tables.context_entries as Row[]).some(
                (row) => row.entry_type === 'memory',
            ),
        ).toBe(true);
        expect(
            (db.tables.context_edges as Row[]).some(
                (row) =>
                    row.from_entity_id === 'document:doc-1' &&
                    row.to_entity_id === 'artifact:artifact-1',
            ),
        ).toBe(true);
    });

    it('ingests journal and automation producer helpers', async () => {
        const db = new FakeDb() as any;
        await ingestJournalContext(db, 'user-1', {
            id: 'journal-1',
            title: 'Day note',
            content: 'A useful note',
            type: 'journal',
        });
        await ingestAutomationRunContext(db, 'user-1', {
            automationConfigId: 'automation-1',
            runId: 'run-1',
            status: 'completed',
        });
        expect(
            (db.tables.context_entries as Row[]).some(
                (row) => row.entry_type === 'automation_run',
            ),
        ).toBe(true);
        expect(
            (db.tables.context_edges as Row[]).some(
                (row) => row.kind === 'triggered_by',
            ),
        ).toBe(true);
    });

    it('links confirmed Gmail actions to materialized todos and calendar events', async () => {
        const db = new FakeDb() as any;
        await ingestContextNode(db, 'user-1', {
            entityId: 'email:gmail:email-1',
            type: 'email',
            label: 'Project update',
            sourceType: 'gmail',
            sourceId: 'email-1',
        });
        await ingestContextNode(db, 'user-1', {
            entityId: 'agent_action:gmail:email-1:send-the-plan',
            type: 'agent_action',
            label: 'Send the plan',
            sourceType: 'email_actions',
            sourceId: 'action-1',
        });

        await ingestEmailActionTodoContext(db, 'user-1', {
            actionId: 'action-1',
            emailId: 'email-1',
            todoId: 'todo-1',
            title: 'Send the plan',
            dueDate: '2026-06-01',
            actionType: 'deadline',
        });
        await ingestEmailActionCalendarContext(db, 'user-1', {
            actionId: 'action-2',
            emailId: 'email-1',
            eventId: 'event-1',
            title: 'Project meeting',
            start: '2026-06-01T15:00:00Z',
        });
        await ingestCalendarEventContext(db, 'user-1', {
            id: 'event-2',
            summary: 'Planning block',
            start: '2026-06-02T15:00:00Z',
        });

        expect(
            (db.tables.context_entries as Row[]).some(
                (row) => row.entity_id === 'todo:todo-1',
            ),
        ).toBe(true);
        expect(
            (db.tables.context_entries as Row[]).some(
                (row) => row.entity_id === 'calendar_event:event-1',
            ),
        ).toBe(true);
        expect(
            (db.tables.context_edges as Row[]).some(
                (row) =>
                    row.from_entity_id === 'todo:todo-1' &&
                    row.to_entity_id === 'email:gmail:email-1' &&
                    row.kind === 'derived_from',
            ),
        ).toBe(true);
        expect(
            (db.tables.context_edges as Row[]).some(
                (row) =>
                    row.from_entity_id === 'calendar_event:event-1' &&
                    row.kind === 'created_from',
            ),
        ).toBe(true);
    });

    it('deletes explicit edges and leaves generated edges protected', async () => {
        const db = new FakeDb() as any;
        const explicit = await ingestContextEdge(db, 'user-1', {
            fromEntityId: 'a',
            toEntityId: 'b',
            kind: 'explicit',
        });
        const generated = await ingestContextEdge(db, 'user-1', {
            fromEntityId: 'a',
            toEntityId: 'c',
            kind: 'derived_from',
            createdByType: 'system',
        });
        expect(await deleteContextEdge(db, 'user-1', explicit!.id!)).toBe(true);
        await expect(
            deleteContextEdge(db, 'user-1', generated!.id!),
        ).rejects.toThrow('Only explicit edges');
        const graph = buildContextGraph(
            [
                {
                    id: '1',
                    userId: 'user-1',
                    entityId: 'a',
                    entryType: 'goal',
                    label: 'A',
                    data: {},
                    linkedTo: [],
                    createdAt: '',
                    updatedAt: '',
                },
                {
                    id: '2',
                    userId: 'user-1',
                    entityId: 'b',
                    entryType: 'todo',
                    label: 'B',
                    data: {},
                    linkedTo: [],
                    createdAt: '',
                    updatedAt: '',
                },
            ],
            [],
        );
        expect(graph.edges.some((edge) => edge.kind === 'explicit')).toBe(
            false,
        );
    });

    it('backfills adapter rows into real non-widget graph nodes without duplication', async () => {
        const db = new FakeDb() as any;
        const todoRows = [
            {
                rowIndex: 0,
                data: { id: 'todo-1', text: 'Ship broad context graph' },
            },
        ];
        const journalRows = [
            {
                rowIndex: 0,
                data: {
                    id: 'journal-1',
                    title: 'Launch notes',
                    content: 'The graph should show real app data.',
                },
            },
        ];

        const first = await backfillContextRowsForSource(
            db,
            'user-1',
            'todos',
            todoRows,
        );
        await backfillContextRowsForSource(
            db,
            'user-1',
            'journals',
            journalRows,
        );
        const second = await backfillContextRowsForSource(
            db,
            'user-1',
            'todos',
            todoRows,
        );

        expect(first.nodesCreated).toBe(1);
        expect(second.nodesCreated).toBe(0);
        expect(second.nodesUpdated).toBe(1);
        expect(db.tables.context_entries).toHaveLength(2);

        const graph = buildContextGraph(
            await import('@/features/context/services/contextService').then(
                ({ listEntries }) => listEntries(db, 'user-1'),
            ),
            [],
        );
        expect(graph.nodes.map((node) => node.entryType)).toEqual(
            expect.arrayContaining(['todo', 'journal_entry']),
        );
    });

    it('reports actual coverage counts and keeps disconnected real nodes visible', async () => {
        const db = new FakeDb() as any;
        await backfillContextRowsForSource(db, 'user-1', 'todos', [
            { rowIndex: 0, data: { id: 'todo-1', text: 'Disconnected todo' } },
        ]);
        await backfillContextRowsForSource(db, 'user-1', 'files', [
            { rowIndex: 0, data: { id: 'file-1', name: 'brief.pdf' } },
        ]);

        const report = await getRuntimeContextCoverageReport(db, 'user-1');
        expect(report.summary.totalNodes).toBe(2);
        expect(report.summary.nodeCountsByType.todo).toBe(1);
        expect(report.summary.sourceCountsBySourceType.files).toBe(1);
        expect(
            report.features.find((feature) => feature.id === 'todos')
                ?.actualNodeCount,
        ).toBeGreaterThan(0);

        const graph = buildContextGraph(
            await import('@/features/context/services/contextService').then(
                ({ listEntries }) => listEntries(db, 'user-1'),
            ),
            [],
        );
        expect(graph.nodes).toHaveLength(2);
    });

    it('lets permissions block backfill for disabled categories', async () => {
        const db = new FakeDb() as any;
        db.tables.context_permissions.push({
            user_id: 'user-1',
            capture_files: false,
        });

        const result = await backfillContextRowsForSource(
            db,
            'user-1',
            'files',
            [{ rowIndex: 0, data: { id: 'file-1', name: 'blocked.pdf' } }],
        );

        expect(result.nodesAttempted).toBe(1);
        expect(result.nodesSkipped).toBe(1);
        expect(db.tables.context_entries).toHaveLength(0);
    });

    it('tracks broad coverage and validates widget context declarations', () => {
        const manifests = getAllManifests();
        for (const manifest of manifests) {
            expect(
                widgetManifestSchema.safeParse(manifest).success,
                `${manifest.widgetType} manifest should parse`,
            ).toBe(true);
        }

        const missingContextDeclarations = manifests
            .filter((manifest) => !manifest.context)
            .map((manifest) => manifest.widgetType);
        expect(missingContextDeclarations).toEqual([]);

        const summary = getContextCoverageSummary();
        expect(summary.total).toBeGreaterThanOrEqual(12);
        expect(summary.byStatus.wired).toBeGreaterThan(0);
        expect(summary.producerCoverage).toBeGreaterThan(0);
        expect(
            CONTEXT_COVERAGE_REGISTRY.some(
                (feature) => feature.id === 'automations',
            ),
        ).toBe(true);
        expect(
            CONTEXT_COVERAGE_REGISTRY.some(
                (feature) => feature.id === 'journal-mood-habits-recovery',
            ),
        ).toBe(true);
        expect(FILE_AI_ACTIONS.map((action) => action.type)).toContain(
            'data_table_summary',
        );
        expect(FILE_AI_ACTIONS.map((action) => action.type)).toContain(
            'cheatsheet',
        );
    });
});
