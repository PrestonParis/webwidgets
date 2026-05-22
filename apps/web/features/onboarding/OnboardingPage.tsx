'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/features/ui/components/Header';
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

    const canContinue =
        onboarding.profile.currentStep !== 'workspace' ||
        selectedWidgetTypes.length > 0;

    return (
        <>
            <Header />
            <OnboardingShell
                activeStep={onboarding.activeStep}
                stepIndex={onboarding.stepIndex}
                canContinue={canContinue}
                isFirstStep={onboarding.isFirstStep}
                isLastStep={onboarding.isLastStep}
                onBack={onboarding.goBack}
                onNext={handleNext}
            >
                <OnboardingStepRenderer
                    onboarding={onboarding}
                    recommendation={recommendation}
                    selectedWidgetTypes={selectedWidgetTypes}
                    suggestedBucketCount={suggestedBucketTypes.length}
                    integrations={integrations}
                />
            </OnboardingShell>
        </>
    );
}
