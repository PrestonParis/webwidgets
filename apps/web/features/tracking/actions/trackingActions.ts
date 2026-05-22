import type { TrackingActionDefinition } from '@/features/tracking/types/tracking';

function registeredAction(message: string): TrackingActionDefinition['handler'] {
    return async () => ({ ok: true, message });
}

export const TRACKING_ACTIONS: TrackingActionDefinition[] = [
    {
        id: 'tracking.log_entry',
        label: 'Log tracking entry',
        description:
            'Open the quick log flow for any built-in or custom tracking category.',
        requiredInputs: [
            { key: 'category', label: 'Category', type: 'category' },
        ],
        widgetTarget: 'tracking-widget',
        routeTarget: '/tracking',
        handler: registeredAction(
            'Open quick log and preselect the requested category.',
        ),
    },
    {
        id: 'tracking.create_custom_metric',
        label: 'Create custom metric',
        description:
            'Create a new user-defined life metric with reusable fields.',
        requiredInputs: [
            { key: 'label', label: 'Metric name', type: 'text' },
            { key: 'metricType', label: 'Metric type', type: 'text' },
        ],
        routeTarget: '/tracking',
        handler: registeredAction('Open the custom category manager.'),
    },
    {
        id: 'tracking.review_progress',
        label: 'Review progress',
        description:
            'Show streaks, goals, recent logs, and baseline movement for a category.',
        requiredInputs: [
            { key: 'category', label: 'Category', type: 'category' },
        ],
        routeTarget: '/tracking',
        handler: registeredAction(
            'Open tracking progress for the selected category.',
        ),
    },
    {
        id: 'tracking.review_correlations',
        label: 'Review correlations',
        description: 'Open deterministic cross-category correlation analysis.',
        requiredInputs: [],
        routeTarget: '/tracking',
        handler: registeredAction('Open the correlation lab.'),
    },
    {
        id: 'tracking.set_goal',
        label: 'Set tracking goal',
        description:
            'Create or update a daily, weekly, or threshold-based tracking goal.',
        requiredInputs: [
            { key: 'category', label: 'Category', type: 'category' },
            {
                key: 'targetValue',
                label: 'Target',
                type: 'number',
                optional: true,
            },
        ],
        routeTarget: '/tracking',
        handler: registeredAction('Open goal settings for the selected category.'),
    },
    {
        id: 'tracking.plan_recovery',
        label: 'Plan recovery',
        description:
            'Suggest a recovery-focused action when strain signals outpace recovery signals.',
        requiredInputs: [
            { key: 'date', label: 'Date', type: 'date', optional: true },
        ],
        widgetTarget: 'recovery-widget',
        routeTarget: '/tracking',
        handler: registeredAction(
            'Surface a recovery suggestion from tracking signals.',
        ),
    },
    {
        id: 'tracking.inspect_metric',
        label: 'Inspect metric',
        description:
            'Open a metric trend with baseline, recent drift, and related logs.',
        requiredInputs: [
            { key: 'category', label: 'Category', type: 'category' },
            { key: 'metric', label: 'Metric', type: 'metric' },
        ],
        routeTarget: '/tracking',
        handler: registeredAction('Open the metric trend detail view.'),
    },
    {
        id: 'tracking.create_automation',
        label: 'Create tracking automation',
        description:
            'Turn a supported tracking trigger into a reminder or review action.',
        requiredInputs: [
            { key: 'category', label: 'Category', type: 'category' },
            {
                key: 'enabled',
                label: 'Enabled',
                type: 'boolean',
                optional: true,
            },
        ],
        routeTarget: '/tracking',
        handler: registeredAction('Open automation rule setup for tracking.'),
    },
];

export function getTrackingAction(
    id: string,
): TrackingActionDefinition | undefined {
    return TRACKING_ACTIONS.find((action) => action.id === id);
}
