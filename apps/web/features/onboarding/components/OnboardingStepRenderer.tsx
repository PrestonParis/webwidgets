'use client';

import { GenerateStep } from '@/features/onboarding/components/GenerateStep';
import { GoalTextStep } from '@/features/onboarding/components/GoalTextStep';
import { IntegrationStep } from '@/features/onboarding/components/IntegrationStep';
import { WidgetSelectionStep } from '@/features/onboarding/components/WidgetSelectionStep';
import type { IntegrationRuntimeState } from '@/features/onboarding/lib/integrationRegistry';
import type { useOnboardingStore } from '@/features/onboarding/hooks/useOnboardingStore';
import type { WorkspaceRecommendation } from '@/features/onboarding/types/recommendations';
import type { WidgetType } from '@/features/dashboard/types/dashboard';

interface OnboardingStepRendererProps {
    onboarding: ReturnType<typeof useOnboardingStore>;
    recommendation: WorkspaceRecommendation;
    selectedWidgetTypes: WidgetType[];
    suggestedBucketCount: number;
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
    suggestedBucketCount,
    integrations,
}: OnboardingStepRendererProps) {
    const step = onboarding.profile.currentStep;

    if (step === 'goals') {
        return (
            <GoalTextStep
                intent={onboarding.profile.intent}
                onIntentChange={onboarding.updateIntent}
            />
        );
    }
    if (step === 'workspace') {
        return (
            <WidgetSelectionStep
                selectedWidgetTypes={selectedWidgetTypes}
                onToggleWidget={onboarding.toggleWidget}
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

    return (
        <GenerateStep
            selectedCount={selectedWidgetTypes.length}
            bucketCount={suggestedBucketCount}
            recommendation={recommendation}
            preferences={onboarding.profile.preferences}
            generatedWorkspace={onboarding.profile.generatedWorkspace}
        />
    );
}
