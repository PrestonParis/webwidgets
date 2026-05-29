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
    },
    weather: {
        widgetType: 'weather',
        priority: 'normal',
        dataRequirements: [], // pure external API, no persistence
        acceptsSchemas: [],
        exportsSchemas: [],
    },

    // ── Direct API widgets (not yet migrated to import/export) ───────────────
    calendar: {
        widgetType: 'calendar',
        priority: 'high',
        aboveFold: true,
        dataRequirements: [
            // calendar_events adapter wraps Google Calendar + Outlook via calendarService.
            // ExportOptions.startDate/endDate are now supported; the adapter calculates
            // daysAhead from the requested end date and filters results to the range.
            {
                sourceType: 'calendar_events',
                scope: 'current_user',
                required: false,
                label: 'Upcoming events',
                cacheTtlMs: 120_000,
            },
            // TODO(migration): still on sourceType:'api' for the interactive month-grid.
            // CalendarWidget uses useCalendarPage() which manages date navigation state
            // client-side. Moving the month grid to the adapter requires passing dynamic
            // start_date/end_date through useWidgetData, which doesn't support per-request
            // options yet. The CalendarWidget keeps its direct fetch for this path.
            {
                sourceType: 'api',
                apiRoute: '/api/calendar/events',
                required: false,
                label: 'Month events',
                cacheTtlMs: 60_000,
            },
        ],
        acceptsSchemas: ['calendar_event'],
        exportsSchemas: [],
    },
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
            // TODO(migration): per-deck card fetch stays on sourceType:'api' because the
            // deck ID (needed to filter cards) isn't available at manifest load time.
            // This source is only used by the full MemorizationPage review flow, not the widget.
            {
                sourceType: 'api',
                apiRoute: '/api/memory/cards',
                required: false,
                label: 'Cards (per-deck)',
                cacheTtlMs: 10_000,
            },
        ],
        acceptsSchemas: ['memory_deck'],
        exportsSchemas: [],
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
    },
    news: {
        widgetType: 'news',
        priority: 'low',
        aboveFold: false,
        dataRequirements: [
            // TODO: Migrate to import-export adapter — news is an external feed, not user data.
            // Adapter pattern doesn't apply; consider a dedicated feed-cache layer instead.
            // For now using direct API route - sourceType: 'api'
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
