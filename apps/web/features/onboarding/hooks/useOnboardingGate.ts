import { hasCompletedOnboarding } from '@/features/onboarding/hooks/useOnboardingStore';

export function useOnboardingGate(
    userId: string | undefined,
    authenticated: boolean,
) {
    return {
        ready: true,
        shouldShowOnboarding: authenticated && !hasCompletedOnboarding(userId),
    };
}
