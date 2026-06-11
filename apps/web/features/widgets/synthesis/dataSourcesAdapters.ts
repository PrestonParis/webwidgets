import type { DataSourceRegistryEntry } from '../types/synthesisDataSources';

function appSrc(
    id: string,
    label: string,
    emoji: string,
    desc: string,
    schema: Record<string, string>,
): DataSourceRegistryEntry {
    return {
        id,
        label,
        category: 'app_data',
        emoji,
        description: desc,
        schema,
        permissions: [],
        refreshable: true,
        cacheable: true,
        allowedTransformations: [
            'pick_fields',
            'rename_fields',
            'filter_rows',
            'sort_rows',
            'group_by_time',
            'aggregate',
        ],
        freshness: 'minutes',
        refreshStrategy: 'poll',
        providerCapabilities: ['adapter_backed'],
    };
}

export const DATA_SOURCE_REGISTRY_ADAPTERS: DataSourceRegistryEntry[] = [
    appSrc(
        'todos',
        'Todos',
        '✅',
        'Tasks and to-do items from your todo list',
        {
            id: 'string',
            text: 'string',
            completed: 'boolean',
            created_at: 'string',
            completed_at: 'string',
        },
    ),
    appSrc(
        'journals',
        'Journal Entries',
        '📖',
        'Personal journal entries and notes',
        {
            id: 'string',
            title: 'string',
            content: 'string',
            type: 'string',
            created_at: 'string',
        },
    ),
    appSrc(
        'habits',
        'Habits',
        '🔁',
        'Habit definitions and daily completion history',
        {
            id: 'string',
            name: 'string',
            emoji: 'string',
            completed_date: 'string',
            completed: 'boolean',
        },
    ),
    appSrc(
        'memory_decks',
        'Memory Decks',
        '🃏',
        'Flashcard decks and spaced-repetition review schedule',
        {
            id: 'string',
            title: 'string',
            domain: 'string',
            description: 'string',
            status: 'string',
            due_date: 'string',
        },
    ),
    appSrc(
        'countdowns',
        'Countdowns',
        '⏳',
        'Countdown timers and upcoming target dates',
        {
            id: 'string',
            name: 'string',
            target_date: 'string',
            emoji: 'string',
        },
    ),
    appSrc(
        'activity_events',
        'Activity Feed',
        '📡',
        'Cross-app activity and event history',
        {
            id: 'string',
            type: 'string',
            source_id: 'string',
            created_at: 'string',
        },
    ),
    appSrc(
        'recovery_records',
        'Recovery Tracker',
        '🌿',
        'Sobriety and recovery tracker profiles and milestones',
        { id: 'string', tracker_id: 'string', created_at: 'string' },
    ),
    appSrc(
        'context_entries',
        'Context Graph',
        '🕸️',
        'Knowledge graph context entries and entity relationships',
        {
            id: 'string',
            entity_id: 'string',
            source_id: 'string',
            created_at: 'string',
        },
    ),
    appSrc(
        'collaboration_handoffs',
        'Collaboration Handoffs',
        '🤝',
        'Handoff records from your collaboration workspaces',
        { id: 'string', workspace_id: 'string', created_at: 'string' },
    ),
    appSrc('files', 'Files', '📁', 'Uploaded files and attachments', {
        id: 'string',
        name: 'string',
        size: 'number',
        created_at: 'string',
    }),
];
