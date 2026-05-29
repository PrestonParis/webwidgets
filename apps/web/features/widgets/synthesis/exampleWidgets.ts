import type { SynthesizedWidgetDefinition } from './widgetDefinitionInterfaces';

export const SUBSCRIPTION_RISK_WIDGET: SynthesizedWidgetDefinition = {
    id: 'system-subscription-risk',
    name: 'Subscription Risk',
    description:
        'Monitors recurring charges, detects subscription creep, and surfaces cancellation candidates',
    category: 'finance',
    purpose: 'monitor',
    icon: '🔄',
    dataSources: [
        {
            id: 'finance.subscriptions',
            type: 'feature_data',
            label: 'Subscriptions',
            schema: {
                name: 'string',
                amount: 'number',
                billingCycle: 'string',
                active: 'boolean',
            },
            transformations: ['filter_rows', 'sort_rows'],
        },
        {
            id: 'finance.transactions',
            type: 'feature_data',
            label: 'Transactions',
            schema: { amount: 'number', category: 'string', date: 'string' },
            transformations: ['filter_rows', 'group_by_time'],
        },
    ],
    transformations: [
        {
            type: 'filter_rows',
            config: { field: 'active', operator: 'eq', value: 'true' },
        },
        { type: 'sort_rows', config: { field: 'amount', direction: 'desc' } },
    ],
    layout: 'list',
    components: [
        {
            registryId: 'metric-card',
            props: { label: 'Monthly burden', value: 'computed.monthlyTotal' },
            order: 0,
        },
        {
            registryId: 'alert-card',
            props: { message: 'computed.riskMessage', type: 'warning' },
            order: 1,
        },
        {
            registryId: 'list',
            props: {
                items: 'finance.subscriptions',
                variant: 'striped',
                compact: true,
            },
            order: 2,
        },
    ],
    actions: [
        { registryId: 'data.refresh', label: 'Refresh' },
        { registryId: 'nav.open_full_page', label: 'Manage Subscriptions' },
    ],
    automations: [
        {
            trigger: 'schedule',
            action: 'refresh.on_schedule',
            schedule: '0 9 * * 1',
        },
        {
            trigger: 'threshold',
            condition: 'monthlyTotal > 200',
            action: 'alert.threshold_crossed',
        },
    ],
    permissions: [
        {
            scope: 'finance_data',
            reason: 'Reads subscription and transaction data to calculate billing burden',
            required: true,
        },
    ],
    metadata: {
        version: '1.0.0',
        createdBy: 'system',
        tags: ['finance', 'subscriptions', 'recurring', 'risk'],
        complexity: 'moderate',
    },
};

export const CASHFLOW_FORECAST_WIDGET: SynthesizedWidgetDefinition = {
    id: 'system-cashflow-forecast',
    name: 'Cashflow Forecast',
    description:
        'Visualizes income vs expenses for the past 6 months with a 3-month projection',
    category: 'finance',
    purpose: 'visualize',
    icon: '💸',
    dataSources: [
        {
            id: 'finance.transactions',
            type: 'feature_data',
            label: 'Transactions',
            schema: {
                amount: 'number',
                type: 'string',
                date: 'string',
                category: 'string',
            },
            transformations: ['group_by_time', 'aggregate', 'filter_rows'],
        },
    ],
    transformations: [
        {
            type: 'group_by_time',
            config: { dateField: 'date', unit: 'month', aggregation: 'sum' },
        },
    ],
    layout: 'chart',
    components: [
        {
            registryId: 'bar-chart',
            props: {
                data: 'finance.transactions.grouped',
                xKey: 'month',
                yKey: 'amount',
                stacked: false,
                height: 200,
            },
            order: 0,
        },
        {
            registryId: 'stat-row',
            props: { stats: 'computed.cashflowStats' },
            order: 1,
        },
        {
            registryId: 'insight-card',
            props: { text: 'computed.cashflowInsight' },
            order: 2,
        },
    ],
    actions: [
        { registryId: 'data.refresh', label: 'Refresh' },
        { registryId: 'data.create_transaction', label: 'Log Transaction' },
    ],
    automations: [
        {
            trigger: 'schedule',
            action: 'refresh.on_schedule',
            schedule: '0 0 1 * *',
        },
    ],
    permissions: [
        {
            scope: 'finance_data',
            reason: 'Reads transaction history to build cashflow timeline',
            required: true,
        },
    ],
    metadata: {
        version: '1.0.0',
        createdBy: 'system',
        tags: ['finance', 'cashflow', 'forecast', 'budget'],
        complexity: 'moderate',
    },
};

export const MOOD_VS_SLEEP_WIDGET: SynthesizedWidgetDefinition = {
    id: 'system-mood-vs-sleep',
    name: 'Mood vs Sleep',
    description:
        'Correlates sleep quality with mood scores to reveal patterns in your wellbeing',
    category: 'tracking',
    purpose: 'visualize',
    icon: '😴',
    dataSources: [
        {
            id: 'tracking.sleep',
            type: 'feature_data',
            label: 'Sleep Logs',
            schema: { date: 'string', duration: 'number', quality: 'number' },
            transformations: ['pick_fields', 'sort_rows'],
        },
        {
            id: 'tracking.mood',
            type: 'feature_data',
            label: 'Mood Logs',
            schema: { date: 'string', mood: 'number', energy: 'number' },
            transformations: ['pick_fields', 'sort_rows'],
        },
    ],
    transformations: [
        {
            type: 'pick_fields',
            config: { fields: ['date', 'quality', 'mood'] },
        },
        { type: 'sort_rows', config: { field: 'date', direction: 'asc' } },
    ],
    layout: 'chart',
    components: [
        {
            registryId: 'line-chart',
            props: {
                data: 'combined',
                xKey: 'date',
                yKey: 'value',
                color: '#3b82f6',
                smooth: true,
                height: 180,
            },
            order: 0,
        },
        {
            registryId: 'insight-card',
            props: { text: 'computed.correlationInsight' },
            order: 1,
        },
        {
            registryId: 'stat-row',
            props: { stats: 'computed.correlationStats', compact: true },
            order: 2,
        },
    ],
    actions: [
        { registryId: 'data.create_tracking_entry', label: 'Log Today' },
        { registryId: 'data.refresh', label: 'Refresh' },
    ],
    automations: [
        {
            trigger: 'schedule',
            condition: 'hour == 21',
            action: 'log.recurring',
            schedule: '0 21 * * *',
        },
    ],
    permissions: [
        {
            scope: 'tracking_sensitive',
            reason: 'Reads sleep and mood health tracking data',
            required: true,
        },
    ],
    metadata: {
        version: '1.0.0',
        createdBy: 'system',
        tags: ['tracking', 'mood', 'sleep', 'correlation', 'health'],
        complexity: 'moderate',
    },
};

export const EMERGENCY_FUND_RUNWAY_WIDGET: SynthesizedWidgetDefinition = {
    id: 'system-emergency-fund-runway',
    name: 'Emergency Fund Runway',
    description:
        'Shows how many months of expenses your liquid cash covers with 1/3/6 month milestones',
    category: 'finance',
    purpose: 'monitor',
    icon: '🛟',
    dataSources: [
        {
            id: 'finance.accounts',
            type: 'feature_data',
            label: 'Accounts',
            schema: { balance: 'number', type: 'string' },
            transformations: ['filter_rows', 'aggregate'],
        },
        {
            id: 'finance.transactions',
            type: 'feature_data',
            label: 'Transactions',
            schema: { amount: 'number', type: 'string', date: 'string' },
            transformations: ['filter_rows', 'aggregate'],
        },
    ],
    transformations: [
        {
            type: 'filter_rows',
            config: {
                field: 'type',
                operator: 'contains',
                value: 'checking|savings|cash',
            },
        },
        { type: 'aggregate', config: { field: 'balance', fn: 'sum' } },
    ],
    layout: 'metric_card',
    components: [
        {
            registryId: 'gauge',
            props: {
                value: 'computed.runwayMonths',
                max: 12,
                label: 'months runway',
                color: 'computed.statusColor',
            },
            order: 0,
        },
        {
            registryId: 'progress-bar',
            props: {
                value: 'computed.runwayMonths',
                max: 6,
                label: '6-month goal',
                color: '#3b82f6',
                showValue: true,
            },
            order: 1,
        },
        {
            registryId: 'insight-card',
            props: { text: 'computed.runwayInsight' },
            order: 2,
        },
    ],
    actions: [
        { registryId: 'data.refresh', label: 'Refresh' },
        { registryId: 'nav.open_full_page', label: 'View Accounts' },
    ],
    automations: [
        {
            trigger: 'threshold',
            condition: 'runwayMonths < 1',
            action: 'alert.threshold_crossed',
        },
    ],
    permissions: [
        {
            scope: 'finance_data',
            reason: 'Reads account balances and transaction history',
            required: true,
        },
    ],
    metadata: {
        version: '1.0.0',
        createdBy: 'system',
        tags: ['finance', 'emergency', 'savings', 'runway'],
        complexity: 'simple',
    },
};

export const SYSTEM_EXAMPLE_WIDGETS: SynthesizedWidgetDefinition[] = [
    SUBSCRIPTION_RISK_WIDGET,
    CASHFLOW_FORECAST_WIDGET,
    MOOD_VS_SLEEP_WIDGET,
    EMERGENCY_FUND_RUNWAY_WIDGET,
];
