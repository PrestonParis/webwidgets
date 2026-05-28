import type { WidgetPermission } from '@/features/platform/types/widgetTypes';
import type { WidgetTransformationType } from './widgetTypes';
import type { DataSourceRegistryEntry } from './dataSourceTypes';

const ALL_TRANSFORMS: WidgetTransformationType[] = [
    'pick_fields',
    'rename_fields',
    'filter_rows',
    'sort_rows',
    'group_by_time',
    'aggregate',
    'convert_dates',
    'convert_currency',
    'calc_derived',
    'map_to_categories',
];

function src(
    id: string,
    label: string,
    cat: string,
    emoji: string,
    desc: string,
    schema: Record<string, string>,
    perms: WidgetPermission[],
    refreshable: boolean,
    transforms: WidgetTransformationType[],
    extras: Partial<
        Pick<
            DataSourceRegistryEntry,
            | 'freshness'
            | 'refreshStrategy'
            | 'providerCapabilities'
            | 'unavailableReason'
        >
    > = {},
): DataSourceRegistryEntry {
    return {
        id,
        label,
        category: cat,
        emoji,
        description: desc,
        schema,
        permissions: perms,
        refreshable,
        cacheable: true,
        allowedTransformations: transforms,
        freshness: extras.freshness ?? (refreshable ? 'minutes' : 'manual'),
        refreshStrategy:
            extras.refreshStrategy ?? (refreshable ? 'poll' : 'manual'),
        providerCapabilities: extras.providerCapabilities ?? [],
        unavailableReason: extras.unavailableReason,
    };
}

export const DATA_SOURCE_REGISTRY_PART_1_CHUNK_2: DataSourceRegistryEntry[] = [
    src(
        'tracking.mood',
        'Mood Logs',
        'tracking',
        '🧠',
        'Mood scores, energy levels, and journal notes',
        {
            date: 'string',
            mood: 'number',
            energy: 'number',
            notes: 'string',
            tags: 'string[]',
        },
        ['tracking_sensitive'],
        true,
        ALL_TRANSFORMS,
    ),
    src(
        'tracking.meal',
        'Meal Logs',
        'tracking',
        '🍽️',
        'Food entries with calories and macros',
        {
            date: 'string',
            name: 'string',
            calories: 'number',
            protein: 'number',
            carbs: 'number',
            fat: 'number',
        },
        ['tracking_sensitive'],
        true,
        ALL_TRANSFORMS,
    ),
    src(
        'tracking.supplements',
        'Supplement Logs',
        'tracking',
        '💊',
        'Daily supplement intake records',
        {
            date: 'string',
            name: 'string',
            taken: 'boolean',
            dose: 'string',
            notes: 'string',
        },
        ['tracking_sensitive'],
        true,
        ALL_TRANSFORMS,
    ),
    src(
        'tracking.custom',
        'Custom Tracker',
        'tracking',
        '📊',
        'User-defined tracking metric entries',
        {
            date: 'string',
            metric: 'string',
            value: 'number',
            unit: 'string',
            tags: 'string[]',
        },
        ['tracking_sensitive'],
        true,
        ALL_TRANSFORMS,
    ),
    // Calendar
    src(
        'calendar.events',
        'Calendar Events',
        'calendar',
        '📅',
        'Google Calendar event data',
        {
            id: 'string',
            title: 'string',
            start: 'string',
            end: 'string',
            location: 'string',
            description: 'string',
        },
        [],
        true,
        ['filter_rows', 'pick_fields', 'group_by_time', 'sort_rows'],
    ),
    // Email
    src(
        'email.messages',
        'Email Messages',
        'email',
        '📬',
        'Gmail message metadata and labels',
        {
            id: 'string',
            subject: 'string',
            from: 'string',
            date: 'string',
            snippet: 'string',
            labels: 'string[]',
        },
        [],
        true,
        ['filter_rows', 'pick_fields', 'sort_rows'],
    ),
    src(
        'email.actions',
        'Email Actions',
        'email',
        '⚡',
        'Extracted action items from emails',
        {
            id: 'string',
            subject: 'string',
            action: 'string',
            dueDate: 'string',
            priority: 'string',
        },
        [],
        true,
        ['filter_rows', 'sort_rows'],
    ),
];
