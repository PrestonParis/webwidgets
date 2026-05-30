'use client';

import { WelcomeStep } from '@/features/onboarding/components/WelcomeStep';
import { FocusStep } from '@/features/onboarding/components/FocusStep';
import { IntegrationStep } from '@/features/onboarding/components/IntegrationStep';
import { RecommendationStep } from '@/features/onboarding/components/RecommendationStep';
import { LaunchStep } from '@/features/onboarding/components/LaunchStep';
import type { IntegrationRuntimeState } from '@/features/onboarding/lib/integrationRegistry';
import type { useOnboardingStore } from '@/features/onboarding/hooks/useOnboardingStore';
import type { WorkspaceRecommendation } from '@/features/onboarding/types/recommendations';
import type { WidgetType } from '@/features/dashboard/types/dashboard';

interface OnboardingStepRendererProps {
    onboarding: ReturnType<typeof useOnboardingStore>;
    recommendation: WorkspaceRecommendation;
    selectedWidgetTypes: WidgetType[];
    integrations: {
        providers: IntegrationRuntimeState[];
        connectedIds: string[];
        connectProvider: (providerId: string) => Promise<unknown>;
    };
}

export function OnboardingStepRenderer({
    onboarding,
    recommendation,
    selectedWidgetTypes,
    integrations,
}: OnboardingStepRendererProps) {
    const step = onboarding.profile.currentStep;

    if (step === 'welcome') {
        return (
            <WelcomeStep
                selectedGoals={onboarding.profile.goals}
                onToggleGoal={onboarding.toggleGoal}
            />
        );
    }

    if (step === 'focus') {
        return (
            <FocusStep
                selectedAreas={onboarding.profile.focusAreas}
                onToggleArea={onboarding.toggleFocusArea}
            />
        );
    }

    if (step === 'integrations') {
        return (
            <IntegrationStep
                providers={integrations.providers}
                suggestedIds={recommendation.integrations}
                enabledIds={onboarding.profile.enabledIntegrationIds}
                skippedIds={onboarding.profile.skippedIntegrationIds}
                onToggle={onboarding.toggleIntegration}
                onSkip={onboarding.toggleSkippedIntegration}
                onConnect={(providerId) => {
                    void integrations.connectProvider(providerId);
                }}
            />
        );
    }

    if (step === 'recommendation') {
        return (
            <RecommendationStep
                recommendation={recommendation}
                selectedWidgetTypes={selectedWidgetTypes}
                onToggleWidget={onboarding.toggleWidget}
            />
        );
    }

    return (
        <LaunchStep
            connectedIntegrationIds={integrations.connectedIds}
            selectedWidgetTypes={selectedWidgetTypes}
            enabledAutomationIds={onboarding.profile.enabledAutomationIds}
            recommendation={recommendation}
        />
    );
}
