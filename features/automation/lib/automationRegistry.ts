import type { AutomationConfig } from '@/features/automation/types/automation';

export const AUTOMATION_WIDGETS = [
    {
        id: 'automation-center',
        title: 'Automation center',
        description:
            'Configure triggers, conditions, actions, consent, and approval requirements.',
        status: 'Scaffold',
    },
    {
        id: 'suggested-automations',
        title: 'Suggested automations',
        description: 'Onboarding and service-based recommendations.',
        status: 'Ready shell',
    },
    {
        id: 'recent-runs',
        title: 'Recent automation runs',
        description: 'Run history model for future execution services.',
        status: 'Coming soon',
    },
] as const;

export const DEFAULT_AUTOMATION_TEMPLATE: Pick<
    AutomationConfig,
    'triggerType' | 'conditionTypes' | 'actionTypes' | 'requiresApproval'
> = {
    triggerType: 'manual',
    conditionTypes: ['consent_granted'],
    actionTypes: ['request_approval'],
    requiresApproval: true,
};
