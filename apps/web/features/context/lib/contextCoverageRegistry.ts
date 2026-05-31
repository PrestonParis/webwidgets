export type ContextCoverageStatus =
    | 'wired'
    | 'partial'
    | 'missing'
    | 'not_applicable'
    | 'blocked';

export interface ContextCoverageEntry {
    id: string;
    name: string;
    area: string;
    routeOrModule: string;
    primaryDataSource: string;
    adapterSourceType?: string;
    producesContext: boolean;
    producedNodeTypes: string[];
    producedEdgeKinds: string[];
    consumesContext: boolean;
    consumedNodeTypes: string[];
    widgetManifestDeclared: boolean | 'not_applicable';
    permissionsApply: boolean;
    status: ContextCoverageStatus;
    notes: string;
}

export const CONTEXT_COVERAGE_REGISTRY: ContextCoverageEntry[] = [
    {
        id: 'dashboard-widgets',
        name: 'Dashboard Widgets',
        area: 'dashboard',
        routeOrModule:
            '/, apps/web/features/dashboard/runtime/widgetManifestRegistry.ts',
        primaryDataSource: 'widget manifests + adapter/API requirements',
        producesContext: true,
        producedNodeTypes: ['widget', 'widget_activity'],
        producedEdgeKinds: ['produced_by', 'consumed_by', 'used_by'],
        consumesContext: true,
        consumedNodeTypes: ['profile', 'goal', 'todo', 'document', 'memory'],
        widgetManifestDeclared: true,
        permissionsApply: true,
        status: 'partial',
        notes: 'Runtime can request widget context bundles; individual widgets still need UI-specific use of related context.',
    },
    {
        id: 'todos',
        name: 'Todos',
        area: 'productivity',
        routeOrModule: '/api/todos, /api/todos/[id]',
        primaryDataSource: 'todos',
        adapterSourceType: 'todos',
        producesContext: true,
        producedNodeTypes: ['todo'],
        producedEdgeKinds: ['produced_by', 'supports_goal', 'scheduled_for'],
        consumesContext: true,
        consumedNodeTypes: ['email', 'calendar_event', 'document', 'goal'],
        widgetManifestDeclared: true,
        permissionsApply: true,
        status: 'wired',
        notes: 'Create/update/delete and adapter import/export paths ingest todo context. Todo-specific related-context UI remains future work.',
    },
    {
        id: 'calendar',
        name: 'Calendar / Planning',
        area: 'planning',
        routeOrModule: '/planning, /api/calendar/events, calendarEventsAdapter',
        primaryDataSource: 'Google/Outlook calendar snapshot',
        adapterSourceType: 'calendar_events',
        producesContext: true,
        producedNodeTypes: ['calendar_event'],
        producedEdgeKinds: ['scheduled_for', 'created_from'],
        consumesContext: true,
        consumedNodeTypes: ['todo', 'email', 'project', 'goal'],
        widgetManifestDeclared: true,
        permissionsApply: true,
        status: 'partial',
        notes: 'Adapter mapper exists and export/runtime can explicitly ingest. Passive calendar reads do not ingest to avoid graph explosion.',
    },
    {
        id: 'inbox-gmail',
        name: 'Inbox / Gmail Actions',
        area: 'inbox',
        routeOrModule: '/inbox, /api/gmail/extract-actions',
        primaryDataSource: 'email_actions plus live Gmail messages',
        producesContext: true,
        producedNodeTypes: ['email', 'agent_action'],
        producedEdgeKinds: ['derived_from', 'mentions'],
        consumesContext: false,
        consumedNodeTypes: [],
        widgetManifestDeclared: 'not_applicable',
        permissionsApply: true,
        status: 'partial',
        notes: 'Extraction creates email/action context. Confirmation now materializes todos and Google Calendar events into context, but inbox does not yet consume related context.',
    },
    {
        id: 'documents',
        name: 'Documents / Notes',
        area: 'documents',
        routeOrModule: '/documents, /api/documents, /journal',
        primaryDataSource: 'documents, journals',
        adapterSourceType: 'journals',
        producesContext: true,
        producedNodeTypes: ['document', 'journal_entry', 'memory'],
        producedEdgeKinds: ['created_from', 'derived_from', 'mentions'],
        consumesContext: true,
        consumedNodeTypes: ['file', 'artifact', 'goal', 'todo'],
        widgetManifestDeclared: true,
        permissionsApply: true,
        status: 'partial',
        notes: 'Document and journal routes ingest. Document related-context panel is not yet surfaced.',
    },
    {
        id: 'files-artifacts',
        name: 'Files / Extraction / Artifacts',
        area: 'files',
        routeOrModule: '/files, /api/uploads, /api/artifacts',
        primaryDataSource: 'file_uploads, file_text_extractions, artifacts',
        adapterSourceType: 'files',
        producesContext: true,
        producedNodeTypes: ['file', 'document', 'artifact'],
        producedEdgeKinds: ['derived_from', 'summarizes', 'created_from'],
        consumesContext: true,
        consumedNodeTypes: ['document', 'artifact', 'todo', 'goal'],
        widgetManifestDeclared: true,
        permissionsApply: true,
        status: 'wired',
        notes: 'Upload confirmation, extraction, artifact, and document paths produce context; lineage UI remains future work.',
    },
    {
        id: 'journal-mood-habits-recovery',
        name: 'Journal / Mood / Habits / Recovery',
        area: 'personal tracking',
        routeOrModule: '/journal, /tracking, /recovery, adapters',
        primaryDataSource: 'journals, mood_logs, habits, recovery_profiles',
        adapterSourceType: 'journals,mood_logs,habits,recovery_records',
        producesContext: true,
        producedNodeTypes: [
            'journal_entry',
            'mood_entry',
            'habit_entry',
            'recovery_entry',
        ],
        producedEdgeKinds: ['relates_to', 'temporal_next', 'supports_goal'],
        consumesContext: true,
        consumedNodeTypes: ['goal', 'journal_entry', 'mood_entry'],
        widgetManifestDeclared: true,
        permissionsApply: true,
        status: 'partial',
        notes: 'Adapter mappers cover these sources. Direct tracking mutation routes still need deeper per-action wiring.',
    },
    {
        id: 'finance',
        name: 'Finance',
        area: 'finance',
        routeOrModule: '/finance, financeAdapter',
        primaryDataSource: 'finance_accounts, finance_transactions',
        adapterSourceType: 'finance_records',
        producesContext: true,
        producedNodeTypes: ['insight', 'goal', 'widget_activity'],
        producedEdgeKinds: ['belongs_to', 'relates_to'],
        consumesContext: true,
        consumedNodeTypes: ['goal', 'project', 'recommendation'],
        widgetManifestDeclared: true,
        permissionsApply: true,
        status: 'partial',
        notes: 'Mapper creates conservative summaries, not raw transaction prompt dumps. Mutation route ingestion remains future work.',
    },
    {
        id: 'memorization-reading',
        name: 'Memorization / Reading',
        area: 'learning',
        routeOrModule:
            '/memorization, /reading, memoryDecksAdapter, reading APIs',
        primaryDataSource: 'memory_decks, memory_cards, reading_*',
        adapterSourceType: 'memory_decks',
        producesContext: true,
        producedNodeTypes: ['memory', 'document', 'insight'],
        producedEdgeKinds: ['derived_from', 'supports_goal', 'temporal_next'],
        consumesContext: true,
        consumedNodeTypes: ['document', 'goal', 'artifact'],
        widgetManifestDeclared: true,
        permissionsApply: true,
        status: 'partial',
        notes: 'Deck summaries are mapped. Reading bookmark/highlight/note mutation routes still need direct producer wiring.',
    },
    {
        id: 'collaboration',
        name: 'Collaboration / Handoffs',
        area: 'collaboration',
        routeOrModule: '/collaboration, collaborationHandoffsAdapter',
        primaryDataSource: 'collaboration_handoffs',
        adapterSourceType: 'collaboration_handoffs',
        producesContext: true,
        producedNodeTypes: ['agent_action', 'insight'],
        producedEdgeKinds: ['assigned_to', 'belongs_to'],
        consumesContext: true,
        consumedNodeTypes: ['project', 'todo', 'document', 'chat'],
        widgetManifestDeclared: true,
        permissionsApply: true,
        status: 'partial',
        notes: 'Adapter mapper covers handoffs. Workspace/member/comment producers remain future work.',
    },
    {
        id: 'automations',
        name: 'Automation Center',
        area: 'automation',
        routeOrModule: '/automation, automationService',
        primaryDataSource: 'automation_configs, automation_runs',
        producesContext: true,
        producedNodeTypes: ['automation', 'automation_run', 'agent_action'],
        producedEdgeKinds: ['triggered_by', 'produced_by', 'consumed_by'],
        consumesContext: true,
        consumedNodeTypes: ['todo', 'email', 'calendar_event', 'document'],
        widgetManifestDeclared: 'not_applicable',
        permissionsApply: true,
        status: 'partial',
        notes: 'Run logging now writes automation_run context. Dependency graph and pre-run bundle usage remain future work.',
    },
    {
        id: 'news',
        name: 'News',
        area: 'news',
        routeOrModule: '/news, /api/news/feed',
        primaryDataSource: 'external feed plus activity events',
        producesContext: false,
        producedNodeTypes: ['recommendation', 'document', 'widget_activity'],
        producedEdgeKinds: ['relates_to'],
        consumesContext: false,
        consumedNodeTypes: ['goal', 'project', 'interest'],
        widgetManifestDeclared: true,
        permissionsApply: true,
        status: 'missing',
        notes: 'Passive RSS fetches intentionally do not ingest. Saved/opened/summarized article actions need producer wiring.',
    },
    {
        id: 'onboarding-profile',
        name: 'Onboarding / Profile / Goals / Integrations',
        area: 'profile',
        routeOrModule: '/onboarding, /settings/profile, context seeding',
        primaryDataSource: 'onboarding profile, context_entries',
        producesContext: true,
        producedNodeTypes: ['profile', 'goal', 'integration', 'widget'],
        producedEdgeKinds: ['supports_goal', 'belongs_to', 'produced_by'],
        consumesContext: true,
        consumedNodeTypes: ['profile', 'goal'],
        widgetManifestDeclared: 'not_applicable',
        permissionsApply: true,
        status: 'partial',
        notes: 'Existing context seeding exists; server-backed profile update producer coverage should be verified after migration.',
    },
    {
        id: 'developer-system-health',
        name: 'Developer / System Health',
        area: 'developer',
        routeOrModule: '/developer, /datahealth, /metrics',
        primaryDataSource: 'diagnostics and metrics APIs',
        producesContext: false,
        producedNodeTypes: ['insight', 'agent_action'],
        producedEdgeKinds: ['relates_to'],
        consumesContext: false,
        consumedNodeTypes: [],
        widgetManifestDeclared: true,
        permissionsApply: false,
        status: 'blocked',
        notes: 'Mostly diagnostics/runtime status. Add only user-saved diagnostics or agent actions later.',
    },
];

export function getContextCoverageSummary() {
    const byStatus = CONTEXT_COVERAGE_REGISTRY.reduce<
        Record<ContextCoverageStatus, number>
    >(
        (acc, entry) => {
            acc[entry.status] += 1;
            return acc;
        },
        {
            wired: 0,
            partial: 0,
            missing: 0,
            not_applicable: 0,
            blocked: 0,
        },
    );

    return {
        total: CONTEXT_COVERAGE_REGISTRY.length,
        byStatus,
        producerCoverage: CONTEXT_COVERAGE_REGISTRY.filter(
            (entry) => entry.producesContext,
        ).length,
        consumerCoverage: CONTEXT_COVERAGE_REGISTRY.filter(
            (entry) => entry.consumesContext,
        ).length,
    };
}
