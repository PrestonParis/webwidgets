import type { AutomationConfig } from '@/features/automation/types/automation';

export const AUTOMATION_WIDGETS = [
    {
        id: 'automation-center',
        title: 'Automation center',
        description:
            'Configure triggers, conditions, actions, consent, and approval requirements.',
        status: 'Ready',
    },
    {
        id: 'automations',
        title: 'Automations',
        description: 'Onboarding and service-based recommendations.',
        status: 'Ready shell',
    },
    {
        id: 'recent-runs',
        title: 'Recent automation runs',
        description: 'Run history model ready for execution service events.',
        status: 'Provider-ready',
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
