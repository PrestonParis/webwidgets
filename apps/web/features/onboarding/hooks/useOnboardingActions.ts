import { useCallback } from 'react';
import type { WidgetType } from '@/features/dashboard/types/dashboard';
import {
    ONBOARDING_STEPS,
    getStepDefinition,
} from '@/features/onboarding/lib/stepDefinitions';
import type {
    FocusAreaId,
    OnboardingGoalId,
    OnboardingStepId,
} from '@/features/onboarding/types/goals';
import type {
    OnboardingPreferences,
    OnboardingProfile,
} from '@/features/onboarding/types/profile';

export function useOnboardingActions(
    profile: OnboardingProfile,
    stepIndex: number,
    persistProfile: (next: OnboardingProfile) => void,
) {
    const setStep = useCallback(
        (stepId: OnboardingStepId) =>
            persistProfile({
                ...profile,
                status: 'in_progress',
                currentStep: stepId,
            }),
        [persistProfile, profile],
    );

    const goNext = useCallback(() => {
        const nextStep = getStepDefinition(
            Math.min(stepIndex + 1, ONBOARDING_STEPS.length - 1),
        );
        persistProfile({
            ...profile,
            status: 'in_progress',
            currentStep: nextStep.id,
        });
    }, [persistProfile, profile, stepIndex]);

    const goBack = useCallback(() => {
        const previousStep = getStepDefinition(Math.max(stepIndex - 1, 0));
        persistProfile({
            ...profile,
            status: 'in_progress',
            currentStep: previousStep.id,
        });
    }, [persistProfile, profile, stepIndex]);

    const toggleGoal = useCallback(
        (goalId: OnboardingGoalId) => {
            const goals = profile.goals.includes(goalId)
                ? profile.goals.filter((id) => id !== goalId)
                : [...profile.goals, goalId];
            persistProfile({ ...profile, goals });
        },
        [persistProfile, profile],
    );

    const toggleFocusArea = useCallback(
        (areaId: FocusAreaId) => {
            const focusAreas = profile.focusAreas.includes(areaId)
                ? profile.focusAreas.filter((id) => id !== areaId)
                : [...profile.focusAreas, areaId];
            persistProfile({ ...profile, focusAreas });
        },
        [persistProfile, profile],
    );

    const toggleWidget = useCallback(
        (widgetType: WidgetType) => {
            const selectedWidgetTypes = profile.selectedWidgetTypes.includes(
                widgetType,
            )
                ? profile.selectedWidgetTypes.filter(
                      (type) => type !== widgetType,
                  )
                : [...profile.selectedWidgetTypes, widgetType];
            persistProfile({ ...profile, selectedWidgetTypes });
        },
        [persistProfile, profile],
    );

    const setSelectedWidgets = useCallback(
        (widgetTypes: WidgetType[]) => {
            persistProfile({ ...profile, selectedWidgetTypes: widgetTypes });
        },
        [persistProfile, profile],
    );

    return {
        setStep,
        goNext,
        goBack,
        toggleGoal,
        toggleFocusArea,
        toggleWidget,
        setSelectedWidgets,
        updateIntent: (intent: string) =>
            persistProfile({ ...profile, status: 'in_progress', intent }),
        toggleIntegration: (providerId: string) =>
            toggleString(
                profile.enabledIntegrationIds,
                providerId,
                (enabledIntegrationIds) =>
                    persistProfile({ ...profile, enabledIntegrationIds }),
            ),
        toggleSkippedIntegration: (providerId: string) =>
            toggleString(
                profile.skippedIntegrationIds,
                providerId,
                (skippedIntegrationIds) =>
                    persistProfile({ ...profile, skippedIntegrationIds }),
            ),
        toggleAutomation: (automationId: string) =>
            toggleString(
                profile.enabledAutomationIds,
                automationId,
                (enabledAutomationIds) =>
                    persistProfile({ ...profile, enabledAutomationIds }),
            ),
        updatePreferences: (preferences: Partial<OnboardingPreferences>) =>
            persistProfile({
                ...profile,
                preferences: { ...profile.preferences, ...preferences },
            }),
        completeOnboarding: (
            next: Pick<
                OnboardingProfile,
                | 'selectedWidgetTypes'
                | 'enabledAutomationIds'
                | 'generatedWorkspace'
            >,
        ) =>
            persistProfile({
                ...profile,
                ...next,
                status: 'completed',
                completed: true,
                currentStep: 'launch',
            }),
        skipOnboarding: () =>
            persistProfile({ ...profile, status: 'skipped', completed: true }),
    };
}

function toggleString(
    items: string[],
    item: string,
    apply: (next: string[]) => void,
) {
    apply(
        items.includes(item)
            ? items.filter((id) => id !== item)
            : [...items, item],
    );
}
