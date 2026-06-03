// Registry mapping widget types to their data manifests.
// This replaces the untyped DATA_KEYS map in widgetRuntimeMetadata.ts.
// Widgets with import/export adapter sources get batching + deduplication.
// Widgets still on direct API routes use sourceType: 'api' until migrated.

import type { WidgetManifest } from './widgetManifest';

const MANIFESTS: Partial<Record<string, WidgetManifest>> = {
    // ── Import/Export adapter-backed widgets ─────────────────────────────────
    todo: {
        widgetType: 'todo',
        priority: 'high',
        aboveFold: true,
        dataRequirements: [
            {
                sourceType: 'todos',
                scope: 'current_user',
                required: true,
                label: 'Tasks',
                cacheTtlMs: 15_000,
            },
        ],
        acceptsSchemas: ['task'],
        exportsSchemas: ['task'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['todo', 'widget_activity'],
            consumedNodeTypes: ['goal', 'project', 'calendar_event'],
            contextSourceType: 'todos',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
    tracking: {
        widgetType: 'tracking',
        priority: 'normal',
        aboveFold: false,
        dataRequirements: [
            {
                sourceType: 'tracking_entries',
                scope: 'current_user',
                required: true,
                label: 'Tracking entries',
                cacheTtlMs: 30_000,
            },
            {
                sourceType: 'api',
                apiRoute: '/api/tracking/goals',
                required: false,
                label: 'Goals',
                cacheTtlMs: 60_000,
            },
        ],
        acceptsSchemas: ['tracking_entry'],
        exportsSchemas: ['tracking_entry'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: [
                'habit_entry',
                'mood_entry',
                'recovery_entry',
                'widget_activity',
            ],
            consumedNodeTypes: ['goal', 'journal_entry', 'insight'],
            contextSourceType: 'tracking_entries',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
    'tracking-supplements': {
        widgetType: 'tracking-supplements',
        priority: 'normal',
        aboveFold: false,
        dataRequirements: [
            {
                sourceType: 'api',
                apiRoute: '/api/supplements',
                required: true,
                label: 'Supplements',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: ['tracking_entry'],
        exportsSchemas: [],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['habit_entry', 'widget_activity'],
            consumedNodeTypes: ['goal', 'journal_entry', 'mood_entry'],
            contextSourceType: 'supplements',
            captureInteractions: true,
            contextScopes: ['private', 'cross_widget'],
        },
    },
    collaboration: {
        widgetType: 'collaboration',
        priority: 'normal',
        aboveFold: false,
        dataRequirements: [
            {
                sourceType: 'collaboration_workspaces',
                scope: 'current_user',
                required: true,
                label: 'Workspaces',
                cacheTtlMs: 20_000,
            },
            {
                sourceType: 'collaboration_handoffs',
                scope: 'current_user',
                required: false,
                label: 'Handoffs',
                cacheTtlMs: 20_000,
            },
        ],
        acceptsSchemas: ['workspace', 'handoff'],
        exportsSchemas: ['handoff'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: [
                'agent_action',
                'document',
                'import_export_object',
            ],
            consumedNodeTypes: ['project', 'todo', 'document', 'chat'],
            contextSourceType: 'collaboration_handoffs',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
    chat: {
        widgetType: 'chat',
        priority: 'high',
        aboveFold: false,
        dataRequirements: [
            {
                sourceType: 'context_entries',
                scope: 'current_user',
                required: false,
                label: 'Context',
                cacheTtlMs: 60_000,
            },
            {
                sourceType: 'api',
                apiRoute: '/api/chat/conversations',
                required: true,
                label: 'Conversations',
                cacheTtlMs: 10_000,
            },
            {
                sourceType: 'api',
                apiRoute: '/api/chat/model-keys',
                required: false,
                label: 'Model keys',
                cacheTtlMs: 60_000,
            },
        ],
        acceptsSchemas: ['generic_record'],
        exportsSchemas: [],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['chat', 'chat_gist', 'memory'],
            consumedNodeTypes: ['profile', 'goal', 'todo', 'document', 'file'],
            contextSourceType: 'chat',
            captureInteractions: true,
            contextScopes: ['private', 'ai'],
        },
    },
    'context-diagram': {
        widgetType: 'context-diagram',
        priority: 'normal',
        aboveFold: false,
        dataRequirements: [
            {
                sourceType: 'context_entries',
                scope: 'current_user',
                required: true,
                label: 'Context graph',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: ['generic_record'],
        exportsSchemas: ['generic_record'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['insight', 'agent_action'],
            consumedNodeTypes: [
                'profile',
                'goal',
                'todo',
                'document',
                'file',
                'widget_activity',
            ],
            contextSourceType: 'context_entries',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },

    // ── Import/Export adapter-backed widgets (new) ───────────────────────────
    mood: {
        widgetType: 'mood',
        priority: 'normal',
        dataRequirements: [
            {
                sourceType: 'mood_logs',
                scope: 'current_user',
                required: true,
                label: 'Mood logs',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: ['mood_log'],
        exportsSchemas: ['mood_log'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['mood_entry', 'widget_activity'],
            consumedNodeTypes: [
                'journal_entry',
                'habit_entry',
                'recovery_entry',
            ],
            contextSourceType: 'mood_logs',
            captureInteractions: true,
            contextScopes: ['private', 'ai'],
        },
    },
    journal: {
        widgetType: 'journal',
        priority: 'normal',
        dataRequirements: [
            {
                sourceType: 'journals',
                scope: 'current_user',
                required: true,
                label: 'Journal entries',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: ['journal_entry'],
        exportsSchemas: ['journal_entry'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['journal_entry', 'memory'],
            consumedNodeTypes: ['goal', 'mood_entry', 'habit_entry'],
            contextSourceType: 'journals',
            captureInteractions: true,
            contextScopes: ['private', 'ai'],
        },
    },
    habit: {
        widgetType: 'habit',
        priority: 'high',
        aboveFold: true,
        dataRequirements: [
            // habitAdapter returns inlinePayload: { habits, completions } (last 30 days).
            // The widget uses completions for streaks, isCompletedToday, and calendar views.
            {
                sourceType: 'habits',
                scope: 'current_user',
                required: true,
                label: 'Habits + completions',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: ['habit'],
        exportsSchemas: ['habit'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['habit_entry', 'widget_activity'],
            consumedNodeTypes: ['goal', 'mood_entry', 'recovery_entry'],
            contextSourceType: 'habits',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
    finance: {
        widgetType: 'finance',
        priority: 'normal',
        dataRequirements: [
            {
                sourceType: 'finance_records',
                scope: 'current_user',
                required: true,
                label: 'Finance records',
                cacheTtlMs: 60_000,
            },
        ],
        acceptsSchemas: ['finance_record'],
        exportsSchemas: ['finance_record'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['insight', 'widget_activity'],
            consumedNodeTypes: ['goal', 'recommendation'],
            contextSourceType: 'finance_records',
            captureInteractions: true,
            contextScopes: ['private'],
        },
    },
    countdown: {
        widgetType: 'countdown',
        priority: 'normal',
        dataRequirements: [
            {
                sourceType: 'countdowns',
                scope: 'current_user',
                required: true,
                label: 'Countdowns',
                cacheTtlMs: 60_000,
            },
        ],
        acceptsSchemas: ['countdown'],
        exportsSchemas: ['countdown'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['todo', 'widget_activity'],
            consumedNodeTypes: ['calendar_event', 'goal'],
            contextSourceType: 'countdowns',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
    recovery: {
        widgetType: 'recovery',
        priority: 'normal',
        dataRequirements: [
            {
                sourceType: 'recovery_records',
                scope: 'current_user',
                required: false,
                label: 'Recovery profiles',
                cacheTtlMs: 60_000,
            },
        ],
        acceptsSchemas: ['recovery_record'],
        exportsSchemas: ['recovery_record'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['recovery_entry'],
            consumedNodeTypes: ['habit_entry', 'journal_entry', 'mood_entry'],
            contextSourceType: 'recovery_records',
            captureInteractions: true,
            contextScopes: ['private', 'ai'],
        },
    },
    weather: {
        widgetType: 'weather',
        priority: 'normal',
        dataRequirements: [], // pure external API, no persistence
        acceptsSchemas: [],
        exportsSchemas: [],
        context: {
            contextProducer: false,
            contextConsumer: false,
            producedNodeTypes: [],
            consumedNodeTypes: [],
            contextSourceType: 'weather',
            captureInteractions: false,
            contextScopes: [],
        },
    },

    // ── Calendar — fully adapter-backed ──────────────────────────────────────
    // CalendarWidget uses useCalendarAdapterEvents (wraps useAdapterFetch) for
    // the interactive month-grid. Dynamic start/end params produce separate cache
    // entries per month, preventing stale data across navigation.
    calendar: {
        widgetType: 'calendar',
        priority: 'high',
        aboveFold: true,
        dataRequirements: [
            // calendar_events adapter wraps Google Calendar + Outlook via calendarService.
            // The widget reads this for the upcoming-events sidebar (14-day default window).
            // For the interactive month-grid, CalendarWidget calls useCalendarAdapterEvents
            // with dynamic startDate/endDate params — handled outside the manifest system.
            {
                sourceType: 'calendar_events',
                scope: 'current_user',
                required: false,
                label: 'Calendar events',
                cacheTtlMs: 120_000,
            },
        ],
        acceptsSchemas: ['calendar_event'],
        exportsSchemas: [],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['calendar_event', 'widget_activity'],
            consumedNodeTypes: ['todo', 'email', 'goal', 'project'],
            contextSourceType: 'calendar_events',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
    // ── Memorization — fully adapter-backed ───────────────────────────────────
    // MemorizationWidget reads deck summaries via memoryDecksAdapter.
    // Per-deck card fetches (review flow) happen in useMemorization with direct
    // API calls — this is intentional as those are part of the full review page,
    // not the dashboard widget.
    memorization: {
        widgetType: 'memorization',
        priority: 'normal',
        aboveFold: false,
        dataRequirements: [
            // memoryDecksAdapter returns per-deck summaries: card_count, due_count, mastered_count.
            // The widget aggregates totals to show overall due count and active deck count.
            {
                sourceType: 'memory_decks',
                scope: 'current_user',
                required: true,
                label: 'Deck summaries',
                cacheTtlMs: 10_000,
            },
        ],
        acceptsSchemas: ['memory_deck'],
        exportsSchemas: [],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['memory', 'widget_activity'],
            consumedNodeTypes: ['document', 'artifact', 'goal'],
            contextSourceType: 'memory_decks',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
    developer: {
        widgetType: 'developer',
        priority: 'low',
        aboveFold: false,
        dataRequirements: [
            // TODO: Migrate to import-export adapter once developer workspace has a defined DB schema.
            // For now using direct API route - sourceType: 'api'
            {
                sourceType: 'api',
                apiRoute: '/api/developer/workspace',
                required: true,
                label: 'Workspace',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: [],
        exportsSchemas: [],
        context: {
            contextProducer: false,
            contextConsumer: false,
            producedNodeTypes: [],
            consumedNodeTypes: [],
            contextSourceType: 'developer',
            captureInteractions: false,
            contextScopes: [],
        },
    },
    view: {
        widgetType: 'view',
        priority: 'normal',
        aboveFold: false,
        dataRequirements: [
            {
                sourceType: 'api',
                apiRoute: '/api/uploads',
                required: true,
                label: 'Files',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: ['file_upload'],
        exportsSchemas: ['file_upload'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['file', 'widget_activity'],
            consumedNodeTypes: ['document', 'artifact', 'todo'],
            contextSourceType: 'files',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
    files: {
        widgetType: 'files',
        priority: 'normal',
        aboveFold: false,
        dataRequirements: [
            // TODO: Migrate to import-export adapter once uploads are managed via a dedicated files adapter
            // that supports storage bucket integration. For now using direct API route - sourceType: 'api'
            {
                sourceType: 'api',
                apiRoute: '/api/uploads',
                required: true,
                label: 'Files',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: [],
        exportsSchemas: [],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['file', 'widget_activity'],
            consumedNodeTypes: ['document', 'artifact', 'todo'],
            contextSourceType: 'files',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
    news: {
        widgetType: 'news',
        priority: 'low',
        aboveFold: false,
        dataRequirements: [
            // News is an external feed, not user data — the import-export adapter
            // pattern doesn't apply. A dedicated feed-cache layer is the right
            // long-term path; using a direct API route for now.
            {
                sourceType: 'api',
                apiRoute: '/api/news/feed',
                required: true,
                label: 'Feed',
                cacheTtlMs: 300_000,
            },
        ],
        acceptsSchemas: [],
        exportsSchemas: [],
        context: {
            contextProducer: false,
            contextConsumer: true,
            producedNodeTypes: ['recommendation', 'widget_activity'],
            consumedNodeTypes: ['goal', 'project', 'insight'],
            contextSourceType: 'news',
            captureInteractions: true,
            contextScopes: ['private', 'ai'],
        },
    },
    chess: {
        widgetType: 'chess',
        priority: 'low',
        aboveFold: false,
        dataRequirements: [
            // TODO: Migrate to import-export adapter once chess games are persisted to a DB table.
            // For now using direct API route - sourceType: 'api'
            {
                sourceType: 'api',
                apiRoute: '/api/chess/latest',
                required: false,
                label: 'Game',
                cacheTtlMs: 60_000,
            },
        ],
        acceptsSchemas: [],
        exportsSchemas: [],
        context: {
            contextProducer: false,
            contextConsumer: false,
            producedNodeTypes: [],
            consumedNodeTypes: [],
            contextSourceType: 'chess',
            captureInteractions: false,
            contextScopes: [],
        },
    },
    creative: {
        widgetType: 'creative',
        priority: 'normal',
        aboveFold: false,
        dataRequirements: [
            // TODO: Migrate to import-export adapter once creative projects have a stable DB schema.
            // For now using direct API route - sourceType: 'api'
            {
                sourceType: 'api',
                apiRoute: '/api/creative/projects',
                required: true,
                label: 'Projects',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: [],
        exportsSchemas: [],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['project', 'artifact', 'widget_activity'],
            consumedNodeTypes: ['goal', 'file', 'document'],
            contextSourceType: 'creative_projects',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
    reading: {
        widgetType: 'reading',
        priority: 'normal',
        aboveFold: false,
        dataRequirements: [
            // TODO: Migrate to import-export adapter once reading documents are tracked separately
            // from the generic uploads bucket. For now using direct API route - sourceType: 'api'
            {
                sourceType: 'api',
                apiRoute: '/api/uploads',
                required: false,
                label: 'Documents',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: [],
        exportsSchemas: [],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['document', 'insight', 'memory'],
            consumedNodeTypes: ['memory', 'goal', 'artifact'],
            contextSourceType: 'reading',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },

    // ── Stage 1 foundation widgets ────────────────────────────────────────────
    documents: {
        widgetType: 'documents',
        priority: 'normal',
        aboveFold: false,
        dataRequirements: [
            {
                sourceType: 'api',
                apiRoute: '/api/documents',
                required: true,
                label: 'Documents',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: ['document'],
        exportsSchemas: ['document'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['document', 'widget_activity'],
            consumedNodeTypes: ['file', 'artifact', 'goal', 'todo'],
            contextSourceType: 'documents',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
    artifacts: {
        widgetType: 'artifacts',
        priority: 'normal',
        aboveFold: false,
        dataRequirements: [
            {
                sourceType: 'api',
                apiRoute: '/api/artifacts',
                required: true,
                label: 'Artifacts',
                cacheTtlMs: 30_000,
            },
        ],
        acceptsSchemas: ['artifact'],
        exportsSchemas: ['artifact'],
        context: {
            contextProducer: true,
            contextConsumer: true,
            producedNodeTypes: ['artifact', 'widget_activity'],
            consumedNodeTypes: ['file', 'document', 'goal'],
            contextSourceType: 'artifacts',
            captureInteractions: true,
            contextScopes: ['private', 'ai', 'cross_widget'],
        },
    },
};

export function getWidgetManifest(widgetType: string): WidgetManifest | null {
    return MANIFESTS[widgetType] ?? null;
}

export function getAllManifests(): WidgetManifest[] {
    return Object.values(MANIFESTS).filter(
        (m): m is WidgetManifest => m !== undefined,
    );
}

// Returns API routes that the old DATA_KEYS map would have returned.
// Used by widgetRuntimeMetadata.ts to stay backward-compatible.
export function getDataKeysFromManifest(widgetType: string): string[] {
    const manifest = MANIFESTS[widgetType];
    if (!manifest) return [];
    return (manifest.dataRequirements ?? [])
        .filter((r) => r.sourceType === 'api' && r.apiRoute)
        .map((r) => r.apiRoute!);
}
