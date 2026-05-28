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

export const DATA_SOURCE_REGISTRY_PART_2_CHUNK_2: DataSourceRegistryEntry[] = [
    src(
        'sports.scores',
        'Sports Scores',
        'sports',
        '🏟️',
        'Scores, standings, and schedules for teams',
        {
            id: 'string',
            league: 'string',
            team: 'string',
            opponent: 'string',
            startsAt: 'string',
            score: 'string',
        },
        [],
        true,
        ['filter_rows', 'sort_rows'],
        { unavailableReason: 'Sports provider is not configured yet' },
    ),
    src(
        'ai.generated',
        'AI Generated Data',
        'ai',
        '✨',
        'AI summaries, classifications, and generated insights',
        {
            id: 'string',
            prompt: 'string',
            output: 'string',
            model: 'string',
            createdAt: 'string',
        },
        ['ai_analysis'],
        true,
        ['summarization_placeholder', 'entity_extraction_placeholder'],
    ),
    src(
        'computed.derived',
        'Computed Data',
        'computed',
        '🧮',
        'Derived outputs from other widget data sources',
        {
            key: 'string',
            value: 'number',
            label: 'string',
            updatedAt: 'string',
        },
        [],
        false,
        ['calc_derived', 'aggregate', 'score', 'bucket'],
    ),
    // Widget & system
    src(
        'widget.usage',
        'Widget Usage',
        'system',
        '🔧',
        'Widget interaction and engagement statistics',
        {
            widgetType: 'string',
            views: 'number',
            interactions: 'number',
            lastUsed: 'string',
        },
        [],
        false,
        ['pick_fields', 'sort_rows', 'filter_rows'],
    ),
    src(
        'automations.rules',
        'Automation Rules',
        'system',
        '⚙️',
        'Configured automation triggers and actions',
        {
            id: 'string',
            name: 'string',
            trigger: 'string',
            action: 'string',
            enabled: 'boolean',
            lastRun: 'string',
        },
        ['automation_actions'],
        true,
        ['filter_rows', 'pick_fields'],
    ),
    // Manual / static
    src(
        'manual.input',
        'Manual Input',
        'custom',
        '✏️',
        'Data entered directly by the user in the widget',
        { key: 'string', value: 'string' },
        [],
        false,
        ['pick_fields', 'rename_fields', 'map_to_categories'],
    ),
    src(
        'api.custom',
        'Custom API',
        'custom',
        '🌐',
        'External API endpoint configured by the user',
        { url: 'string', method: 'string', headers: 'object', body: 'string' },
        [],
        true,
        [
            'pick_fields',
            'rename_fields',
            'filter_rows',
            'map_to_categories',
            'normalize_records',
        ],
        {
            providerCapabilities: [
                'safe-request-config',
                'schema-validation',
                'server-secret-placeholder',
            ],
        },
    ),
];
