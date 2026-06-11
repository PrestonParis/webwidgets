import type { SynthesizedWidgetDefinition } from '../widgetDefinitionInterfaces';

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
