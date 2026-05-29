import type { WidgetPermission } from '@/features/platform/types/widget';
import type { WidgetTransformationType } from '../types/synthesisWidgets';
import type { DataSourceRegistryEntry } from '../types/synthesisDataSources';

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

export const DATA_SOURCE_REGISTRY_PART_2_CHUNK_1: DataSourceRegistryEntry[] = [
    // Notes / Knowledge
    src(
        'notes.documents',
        'Notes & Documents',
        'knowledge',
        '📝',
        'Text editor documents, journals, and drafts',
        {
            id: 'string',
            title: 'string',
            content: 'string',
            updatedAt: 'string',
            tags: 'string[]',
        },
        [],
        true,
        ['filter_rows', 'pick_fields', 'sort_rows'],
    ),
    // News / events / research
    src(
        'news.feed',
        'Ranked News Feed',
        'news',
        '🗞️',
        'Normalized news and event intelligence entries',
        {
            id: 'string',
            title: 'string',
            publishedAt: 'string',
            source: 'string',
            rankScore: 'number',
            category: 'string',
        },
        [],
        true,
        ALL_TRANSFORMS,
        {
            freshness: 'minutes',
            providerCapabilities: ['rss', 'ranked-events'],
        },
    ),
    src(
        'events.timeline',
        'Universal Timeline Events',
        'events',
        '🧭',
        'Cross-domain timeline events from widgets, providers, and automations',
        {
            id: 'string',
            type: 'string',
            title: 'string',
            occurredAt: 'string',
            source: 'string',
        },
        [],
        true,
        [
            'filter_rows',
            'sort_rows',
            'group_by_time',
            'merge_timelines',
            'rank',
        ],
    ),
    src(
        'research.items',
        'Research Items',
        'research',
        '🔎',
        'Research queue items, readings, citations, and briefings',
        {
            id: 'string',
            title: 'string',
            source: 'string',
            summary: 'string',
            tags: 'string[]',
            updatedAt: 'string',
        },
        ['ai_analysis'],
        true,
        [
            'filter_rows',
            'rank',
            'summarization_placeholder',
            'entity_extraction_placeholder',
        ],
    ),
    src(
        'files.uploads',
        'Uploaded Files',
        'files',
        '📁',
        'Files uploaded to WebWidgets storage',
        {
            id: 'string',
            originalName: 'string',
            mimeType: 'string',
            sizeBytes: 'number',
            createdAt: 'string',
        },
        [],
        true,
        ['filter_rows', 'sort_rows', 'pick_fields'],
    ),
    src(
        'github.activity',
        'GitHub Activity',
        'github',
        '🐙',
        'Issues, pull requests, commits, and review activity',
        {
            id: 'string',
            repo: 'string',
            type: 'string',
            title: 'string',
            actor: 'string',
            createdAt: 'string',
        },
        ['external_imports'],
        true,
        ['filter_rows', 'group_by_time', 'rank'],
        { unavailableReason: 'GitHub OAuth is not connected yet' },
    ),
    src(
        'weather.forecast',
        'Weather Forecast',
        'weather',
        '🌤️',
        'Current conditions and short-range forecast data',
        {
            date: 'string',
            condition: 'string',
            tempHigh: 'number',
            tempLow: 'number',
            precipitation: 'number',
        },
        [],
        true,
        ['pick_fields', 'filter_rows', 'convert_dates'],
    ),
];
