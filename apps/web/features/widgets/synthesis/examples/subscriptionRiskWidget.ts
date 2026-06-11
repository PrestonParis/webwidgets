import type { SynthesizedWidgetDefinition } from '../widgetDefinitionInterfaces';

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
