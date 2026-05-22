'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ONBOARDING_STEPS,
    getStepDefinition,
    getStepIndex,
} from '@/features/onboarding/lib/stepDefinitions';
import {
    cacheOnboardingProfile,
    normalizeOnboardingProfile,
    readOnboardingProfile,
} from '@/features/onboarding/lib/profileStorage';
import { useOnboardingActions } from '@/features/onboarding/hooks/useOnboardingActions';
import type { OnboardingProfile } from '@/features/onboarding/types/profile';
import {
    fetchOnboardingProfile,
    saveOnboardingProfile,
} from '@/features/onboarding/services/onboardingService';

export function hasCompletedOnboarding(userId: string | undefined) {
    return readOnboardingProfile(userId).completed;
}

export function useOnboardingStore(userId: string | undefined) {
    const [profile, setProfileState] = useState<OnboardingProfile>(() =>
        readOnboardingProfile(userId),
    );
    const [loadedUserId, setLoadedUserId] = useState<string | undefined>();

    useEffect(() => {
        if (!userId || loadedUserId === userId) return;
        let active = true;

        void loadProfile(userId).then((next) => {
            if (!active) return;
            setProfileState(next);
            setLoadedUserId(userId);
        });

        return () => {
            active = false;
        };
    }, [loadedUserId, userId]);

    const persistProfile = useCallback(
        (next: OnboardingProfile) => {
            const withTimestamp = {
                ...next,
                updatedAt: new Date().toISOString(),
            };
            setProfileState(withTimestamp);
            cacheOnboardingProfile(userId, withTimestamp);
            if (userId) void saveOnboardingProfile(userId, withTimestamp);
        },
        [userId],
    );

    const stepIndex = getStepIndex(profile.currentStep);
    const activeStep = getStepDefinition(stepIndex);
    const actions = useOnboardingActions(profile, stepIndex, persistProfile);

    return useMemo(
        () => ({
            profile,
            activeStep,
            stepIndex,
            isFirstStep: stepIndex === 0,
            isLastStep: stepIndex === ONBOARDING_STEPS.length - 1,
            ...actions,
        }),
        [actions, activeStep, profile, stepIndex],
    );
}

async function loadProfile(userId: string) {
    try {
        const remoteProfile = await fetchOnboardingProfile(userId);
        const next = remoteProfile
            ? normalizeOnboardingProfile(remoteProfile)
            : readOnboardingProfile(userId);
        cacheOnboardingProfile(userId, next);
        return next;
    } catch {
        return readOnboardingProfile(userId);
    }
}
