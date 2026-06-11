import type { SynthesizedWidgetDefinition } from '../widgetDefinitionInterfaces';

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
