import type { OnboardingStepDefinition } from '@/features/onboarding/types/goals';

export const ONBOARDING_STEPS: OnboardingStepDefinition[] = [
    {
        id: 'welcome',
        label: 'Goals',
        eyebrow: 'Step 1 of 5',
        title: 'What would you like WebWidgets to help you manage?',
        description:
            "Choose everything that applies. We'll build your workspace around your goals.",
    },
    {
        id: 'focus',
        label: 'Focus areas',
        eyebrow: 'Step 2 of 5',
        title: 'What do you need help with?',
        description:
            'Select the tools and areas you want on your dashboard. You can add more later.',
    },
    {
        id: 'integrations',
        label: 'Connect',
        eyebrow: 'Step 3 of 5',
        title: 'Connect your services.',
        description:
            'Link the apps you already use. You can skip any of these and connect them later.',
    },
    {
        id: 'recommendation',
        label: 'Your workspace',
        eyebrow: 'Step 4 of 5',
        title: "Here's what we recommend.",
        description:
            "Based on your goals we've picked a starting workspace. Adjust anything before launching.",
    },
    {
        id: 'launch',
        label: 'Launch',
        eyebrow: 'Step 5 of 5',
        title: 'Your workspace is ready.',
        description: "Here's everything that was set up for you.",
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
            id: 'welcome',
            label: 'Goals',
            eyebrow: 'Step 1 of 5',
            title: 'What would you like WebWidgets to help you manage?',
            description: 'Choose your goals.',
        }
    );
}
