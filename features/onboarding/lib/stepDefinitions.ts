import type { OnboardingStepDefinition } from '@/features/onboarding/types/goals';

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
    {
        id: 'workspace',
        label: 'Widgets',
        eyebrow: 'Home dashboard',
        title: 'Choose what belongs on your dashboard.',
        description:
            'Pick only the widgets you want to see first. Everything else stays available in the widget catalog.',
    },
    {
        id: 'goals',
        label: 'Goal',
        eyebrow: 'Workspace intent',
        title: 'What are you trying to accomplish?',
        description:
            'Describe the workspace you want. WebWidgets stores this for future recommendations and setup passes without pretending to run AI here.',
    },
    {
        id: 'integrations',
        label: 'Services',
        eyebrow: 'Connections',
        title: 'Connect services now, or skip them.',
        description:
            'Connect available providers, mark others for later, and keep unfinished integrations clearly labeled.',
    },
    {
        id: 'generate',
        label: 'Finish',
        eyebrow: 'Dashboard generation',
        title: 'Create your starter workspace.',
        description:
            'Selected widgets go on the dashboard. A few deterministic suggestions land in the bucket for later.',
    },
];

export function getStepIndex(stepId: OnboardingStepDefinition['id']) {
    const index = ONBOARDING_STEPS.findIndex((step) => step.id === stepId);
    return index >= 0 ? index : 0;
}

export function getStepDefinition(index: number): OnboardingStepDefinition {
    return (
        ONBOARDING_STEPS[index] ??
        ONBOARDING_STEPS[0] ?? {
            id: 'workspace',
            label: 'Widgets',
            eyebrow: 'Home dashboard',
            title: 'Choose what belongs on your dashboard.',
            description: 'Pick starting widgets.',
        }
    );
}
