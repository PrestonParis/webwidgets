'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import LoadingState from '@/features/ui/components/LoadingState';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { OnboardingShell } from '@/features/onboarding/components/OnboardingShell';
import { OnboardingStepRenderer } from '@/features/onboarding/components/OnboardingStepRenderer';
import { useIntegrationRuntime } from '@/features/onboarding/hooks/useIntegrationRuntime';
import { useOnboardingStore } from '@/features/onboarding/hooks/useOnboardingStore';
import { buildWorkspaceRecommendation } from '@/features/onboarding/lib/recommendations';
import {
    buildSuggestedBucketWidgets,
    buildOnboardingLayout,
    persistGeneratedWorkspace,
    summarizeGeneratedWorkspace,
    buildOnboardingContextPayloads,
} from '@/features/onboarding/lib/workspaceGeneration';
import {
    saveGeneratedDashboardLayout,
    saveOnboardingWidgetInstances,
} from '@/features/onboarding/services/onboardingService';
import { batchUpsertEntries } from '@/features/context/api/contextApi';

export function OnboardingPage() {
    const router = useRouter();
    const { status, userId } = useAuth();
    const onboarding = useOnboardingStore(userId);
    const integrations = useIntegrationRuntime();

    const recommendation = useMemo(
        () => buildWorkspaceRecommendation(onboarding.profile.goals),
        [onboarding.profile.goals],
    );

    // Auto-populate selected widgets when the user first reaches the recommendation step
    useEffect(() => {
        if (
            onboarding.profile.currentStep === 'recommendation' &&
            onboarding.profile.selectedWidgetTypes.length === 0
        ) {
            onboarding.setSelectedWidgets(
                recommendation.widgets.map((w) => w.widgetType),
            );
        }
    }, [onboarding.profile.currentStep]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedWidgetTypes = onboarding.profile.selectedWidgetTypes;

    const suggestedBucketTypes = buildSuggestedBucketWidgets({
        selectedWidgetTypes,
        goals: onboarding.profile.goals,
        intent: onboarding.profile.intent,
        connectedIntegrationIds: integrations.connectedIds,
        recommendation,
    });

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/');
    }, [router, status]);

    if (status === 'loading' || status === 'unauthenticated')
        return <LoadingState />;

    async function finishOnboarding() {
        if (!userId) return;
        const layout = buildOnboardingLayout(
            selectedWidgetTypes,
            suggestedBucketTypes,
            onboarding.profile.preferences,
        );
        persistGeneratedWorkspace(
            userId,
            layout,
            onboarding.profile.preferences,
        );
        const contextPayloads = buildOnboardingContextPayloads(
            '',
            onboarding.profile.goals,
            selectedWidgetTypes,
            integrations.connectedIds,
            onboarding.profile.intent,
        );
        await Promise.all([
            saveGeneratedDashboardLayout(userId, layout).catch(() => undefined),
            saveOnboardingWidgetInstances(userId, layout).catch(
                () => undefined,
            ),
            batchUpsertEntries(contextPayloads).catch(() => undefined),
        ]);
        onboarding.completeOnboarding({
            selectedWidgetTypes,
            enabledAutomationIds: onboarding.profile.enabledAutomationIds,
            generatedWorkspace: summarizeGeneratedWorkspace(layout, {
                ...recommendation,
                automations: onboarding.profile.enabledAutomationIds,
            }),
        });
        router.push('/');
    }

    function handleNext() {
        if (onboarding.isLastStep) {
            void finishOnboarding();
            return;
        }
        onboarding.goNext();
    }

    const step = onboarding.profile.currentStep;
    const canContinue =
        step === 'welcome' ? onboarding.profile.goals.length > 0 : true;

    return (
        <>
            <OnboardingShell
                activeStep={onboarding.activeStep}
                stepIndex={onboarding.stepIndex}
                canContinue={canContinue}
                isFirstStep={onboarding.isFirstStep}
                isLastStep={onboarding.isLastStep}
                onBack={onboarding.goBack}
                onNext={handleNext}
                onSkip={() => {
                    onboarding.skipOnboarding();
                    router.push('/');
                }}
            >
                <OnboardingStepRenderer
                    onboarding={onboarding}
                    recommendation={recommendation}
                    selectedWidgetTypes={selectedWidgetTypes}
                    integrations={integrations}
                />
            </OnboardingShell>
        </>
    );
}
