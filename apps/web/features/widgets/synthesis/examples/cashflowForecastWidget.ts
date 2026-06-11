import type { SynthesizedWidgetDefinition } from '../widgetDefinitionInterfaces';

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
