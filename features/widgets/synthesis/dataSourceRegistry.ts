import type { WidgetPermission } from '@/features/platform/types/widgetTypes';
import type { WidgetTransformationType } from './widgetDefinitionSchema';

export interface DataSourceRegistryEntry {
    id: string;
    label: string;
    category: string;
    emoji: string;
    description: string;
    schema: Record<string, string>;
    permissions: WidgetPermission[];
    refreshable: boolean;
    cacheable: boolean;
    allowedTransformations: WidgetTransformationType[];
    freshness: 'realtime' | 'minutes' | 'hourly' | 'daily' | 'manual';
    refreshStrategy: 'push' | 'poll' | 'manual' | 'computed';
    providerCapabilities: string[];
    unavailableReason?: string | undefined;
}

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

export const DATA_SOURCE_REGISTRY: DataSourceRegistryEntry[] = [
    // Finance
    src(
        'finance.accounts',
        'Finance Accounts',
        'finance',
        '💳',
        'Bank accounts, credit cards, and investment accounts',
        {
            id: 'string',
            name: 'string',
            type: 'string',
            balance: 'number',
            currency: 'string',
        },
        ['finance_data'],
        true,
        ALL_TRANSFORMS,
    ),
    src(
        'finance.transactions',
        'Transactions',
        'finance',
        '🧾',
        'Income, expense, and transfer records',
        {
            id: 'string',
            title: 'string',
            amount: 'number',
            type: 'string',
            category: 'string',
            date: 'string',
        },
        ['finance_data'],
        true,
        ALL_TRANSFORMS,
    ),
    src(
        'finance.subscriptions',
        'Subscriptions',
        'finance',
        '🔄',
        'Recurring charges and billing schedules',
        {
            id: 'string',
            name: 'string',
            amount: 'number',
            billingCycle: 'string',
            nextBillingDate: 'string',
            active: 'boolean',
        },
        ['finance_data'],
        true,
        ALL_TRANSFORMS,
    ),
    src(
        'finance.watchlist',
        'Watchlist',
        'finance',
        '📈',
        'Stock, crypto, ETF, and real estate price data',
        {
            id: 'string',
            symbol: 'string',
            displayName: 'string',
            assetType: 'string',
            latestValue: 'number',
            currency: 'string',
        },
        ['finance_data'],
        true,
        ALL_TRANSFORMS,
    ),
    src(
        'finance.net_worth',
        'Net Worth Snapshots',
        'finance',
        '💰',
        'Historical net worth, assets, and liabilities',
        {
            date: 'string',
            netWorth: 'number',
            assets: 'number',
            liabilities: 'number',
        },
        ['finance_data'],
        false,
        ['filter_rows', 'group_by_time', 'pick_fields'],
    ),

    // Tracking
    src(
        'tracking.sleep',
        'Sleep Logs',
        'tracking',
        '😴',
        'Duration, quality, and bedtime records',
        {
            date: 'string',
            duration: 'number',
            quality: 'number',
            bedtime: 'string',
            wakeTime: 'string',
        },
        ['tracking_sensitive'],
        true,
        ALL_TRANSFORMS,
    ),
    src(
        'tracking.workout',
        'Workout Logs',
        'tracking',
        '🏋️',
        'Exercise type, duration, and intensity',
        {
            date: 'string',
            type: 'string',
            duration: 'number',
            intensity: 'number',
            notes: 'string',
        },
        ['tracking_sensitive'],
        true,
        ALL_TRANSFORMS,
    ),
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

export function getDataSource(id: string): DataSourceRegistryEntry | undefined {
    return DATA_SOURCE_REGISTRY.find((ds) => ds.id === id);
}

export function getDataSourcesByCategory(
    category: string,
): DataSourceRegistryEntry[] {
    return DATA_SOURCE_REGISTRY.filter((ds) => ds.category === category);
}

export function getDataSourceCategories(): string[] {
    return [...new Set(DATA_SOURCE_REGISTRY.map((ds) => ds.category))];
}
