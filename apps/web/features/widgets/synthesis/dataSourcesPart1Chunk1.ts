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

export const DATA_SOURCE_REGISTRY_PART_1_CHUNK_1: DataSourceRegistryEntry[] = [
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
];
