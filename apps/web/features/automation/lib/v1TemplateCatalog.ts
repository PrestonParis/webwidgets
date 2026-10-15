import type { AutomationDefinition } from '../types/automation';

export type V1TemplateId =
    | 'v1.commitment-capture'
    | 'v1.daily-briefing'
    | 'v1.calendar-preparation'
    | 'v1.stale-task-review';

export interface V1TemplateDefinition extends AutomationDefinition {
    readonly version: 1;
    readonly supportedInputs: readonly string[];
    readonly requiredConsents: readonly string[];
    readonly limits: {
        readonly runsPerHour: number;
        readonly costBudgetCents: number;
    };
    readonly prohibitedEffects: readonly string[];
}

const commonProhibitions = ['send email', 'delete data', 'purchase', 'publish'];

export const V1_TEMPLATE_CATALOG: Readonly<
    Record<V1TemplateId, V1TemplateDefinition>
> = Object.freeze({
    'v1.commitment-capture': {
        id: 'v1.commitment-capture',
        version: 1,
        name: 'Commitment capture',
        description:
            'Turns one eligible commitment candidate into one reviewable task proposal.',
        widgetId: 'tasks',
        widgetName: 'Tasks',
        category: 'Productivity',
        safetyLevel: 'approval_required',
        trigger: { type: 'new_item', label: 'New eligible commitment' },
        conditions: [
            { type: 'data_threshold', label: 'Credible, unexpired candidate' },
            { type: 'frequency_limit', label: 'One task per candidate' },
        ],
        actions: [
            {
                type: 'add_item',
                label: 'Create the exact proposed task',
                safetyLevel: 'approval_required',
                requiresApproval: true,
            },
        ],
        approvalPolicy: {
            required: true,
            draftFirst: true,
            reviewQueue: true,
            alwaysAsk: true,
        },
        consent: {
            providersRequired: [],
            dataRead: ['commitment candidates', 'timeline evidence'],
            dataWritten: ['tasks'],
            affectsExternal: false,
            affectsOthers: false,
            reversible: true,
        },
        supportedInputs: ['task candidate id', 'exact candidate payload'],
        requiredConsents: ['timeline_analysis'],
        limits: { runsPerHour: 10, costBudgetCents: 0 },
        prohibitedEffects: [...commonProhibitions, 'edit existing tasks'],
        defaultEnabled: false,
        suggestedReason:
            'Capture real commitments without letting message content approve actions.',
    },
    'v1.daily-briefing': {
        id: 'v1.daily-briefing',
        version: 1,
        name: 'Daily briefing',
        description:
            'Generates one evidence-backed briefing for each local-day window.',
        widgetId: 'news',
        widgetName: 'Timeline',
        category: 'Intelligence',
        safetyLevel: 'read_only',
        trigger: { type: 'scheduled', label: 'Daily at your local time' },
        conditions: [
            { type: 'frequency_limit', label: 'One briefing per local day' },
            {
                type: 'data_threshold',
                label: 'Disclose missing or stale sources',
            },
        ],
        actions: [
            {
                type: 'generate_digest',
                label: 'Generate an evidence-backed briefing',
                safetyLevel: 'read_only',
                requiresApproval: false,
            },
        ],
        schedule: { type: 'daily', time: '08:00', timezone: 'UTC' },
        approvalPolicy: {
            required: false,
            draftFirst: false,
            reviewQueue: false,
            alwaysAsk: false,
        },
        consent: {
            providersRequired: [],
            dataRead: ['timeline', 'tasks', 'source health'],
            dataWritten: ['briefings'],
            affectsExternal: false,
            affectsOthers: false,
            reversible: true,
        },
        supportedInputs: ['covered-from timestamp', 'covered-to timestamp'],
        requiredConsents: ['timeline_analysis'],
        limits: { runsPerHour: 2, costBudgetCents: 25 },
        prohibitedEffects: [
            ...commonProhibitions,
            'create tasks',
            'change calendar',
        ],
        defaultEnabled: false,
        suggestedReason:
            'Start each day with one source-linked view of changes, due work, and approvals.',
    },
    'v1.calendar-preparation': {
        id: 'v1.calendar-preparation',
        version: 1,
        name: 'Calendar preparation',
        description:
            'Prepares one event from an approved candidate with an explicit start and end.',
        widgetId: 'calendar',
        widgetName: 'Calendar',
        category: 'Productivity',
        safetyLevel: 'approval_required',
        trigger: { type: 'new_item', label: 'Approved calendar candidate' },
        conditions: [
            { type: 'date_range', label: 'Concrete start and end required' },
            { type: 'provider_connected', label: 'Google Calendar connected' },
        ],
        actions: [
            {
                type: 'create_calendar_draft',
                label: 'Create the exact reviewed calendar event',
                safetyLevel: 'approval_required',
                requiresApproval: true,
            },
        ],
        approvalPolicy: {
            required: true,
            draftFirst: true,
            reviewQueue: true,
            alwaysAsk: true,
        },
        consent: {
            providersRequired: ['Google Calendar'],
            dataRead: ['approved calendar candidates'],
            dataWritten: ['Google Calendar event'],
            affectsExternal: true,
            affectsOthers: true,
            reversible: true,
        },
        supportedInputs: [
            'approved candidate id',
            'startsAt',
            'endsAt',
            'timezone',
        ],
        requiredConsents: ['calendar_access'],
        limits: { runsPerHour: 10, costBudgetCents: 0 },
        prohibitedEffects: [
            ...commonProhibitions,
            'invent a time',
            'invite unreviewed attendees',
        ],
        defaultEnabled: false,
        suggestedReason:
            'Move reviewed commitments onto your calendar without guessing dates or times.',
    },
    'v1.stale-task-review': {
        id: 'v1.stale-task-review',
        version: 1,
        name: 'Stale-task review',
        description:
            'Surfaces overdue or inactive open tasks without changing them.',
        widgetId: 'tasks',
        widgetName: 'Tasks',
        category: 'Productivity',
        safetyLevel: 'read_only',
        trigger: { type: 'scheduled', label: 'Weekly at your local time' },
        conditions: [
            { type: 'date_range', label: 'Overdue or inactive for 14 days' },
            { type: 'frequency_limit', label: 'One review per local week' },
        ],
        actions: [
            {
                type: 'notify',
                label: 'Surface tasks for review',
                safetyLevel: 'read_only',
                requiresApproval: false,
            },
        ],
        schedule: { type: 'weekly', days: [1], time: '09:00', timezone: 'UTC' },
        approvalPolicy: {
            required: false,
            draftFirst: false,
            reviewQueue: false,
            alwaysAsk: false,
        },
        consent: {
            providersRequired: [],
            dataRead: ['open tasks'],
            dataWritten: ['automation run history'],
            affectsExternal: false,
            affectsOthers: false,
            reversible: true,
        },
        supportedInputs: ['schedule window'],
        requiredConsents: [],
        limits: { runsPerHour: 2, costBudgetCents: 0 },
        prohibitedEffects: [
            ...commonProhibitions,
            'complete tasks',
            'reschedule tasks',
        ],
        defaultEnabled: false,
        suggestedReason:
            'Keep old work visible while leaving every task decision to you.',
    },
});

export const V1_TEMPLATE_IDS = Object.freeze(
    Object.keys(V1_TEMPLATE_CATALOG) as V1TemplateId[],
);

export function v1TemplateDefinition(id: string) {
    return V1_TEMPLATE_CATALOG[id as V1TemplateId];
}
