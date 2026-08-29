import type { AutomationDefinition } from '@/features/automation/types/automation';

export const V1_SUGGESTION_ID = 'v1-create-task-suggestion';

export const V1_TASK_DEFINITION: AutomationDefinition = {
    id: 'v1.create-task',
    name: 'Daily priority task',
    description:
        'Propose a local task on a daily schedule. Nothing is created until you approve the exact task payload.',
    widgetId: 'tasks',
    widgetName: 'Tasks',
    category: 'Productivity',
    safetyLevel: 'approval_required',
    trigger: { type: 'scheduled', label: 'Daily at 9:00 AM' },
    conditions: [{ type: 'requires_confirmation', label: 'Always ask first' }],
    actions: [
        {
            type: 'add_item',
            label: 'Create a task',
            safetyLevel: 'approval_required',
            requiresApproval: true,
        },
    ],
    schedule: { type: 'daily', time: '09:00', timezone: 'UTC' },
    approvalPolicy: {
        required: true,
        draftFirst: true,
        reviewQueue: true,
        alwaysAsk: true,
    },
    consent: {
        providersRequired: [],
        dataRead: [],
        dataWritten: ['tasks'],
        affectsExternal: false,
        affectsOthers: false,
        reversible: true,
    },
    defaultEnabled: false,
    suggestedReason:
        'This is the V1 automation fixture for safe, approval-gated task completion.',
};
