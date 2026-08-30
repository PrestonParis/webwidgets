'use client';
import SignInPage from '@/features/auth/components/SignInPage';
import { useAuth } from '@/features/auth/hooks/useAuth';
import LoadingState from '@/features/ui/components/LoadingState';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { useOnboardingGate } from '@/features/onboarding/hooks/useOnboardingGate';
import { CommandCenterPage } from '@/features/command-center/components/CommandCenterPage';

// Main page component that conditionally renders either the dashboard or the sign-in page based on authentication status.
export default function Page() {
    const { status, userId } = useAuth();
    const onboardingGate = useOnboardingGate(
        userId,
        status === 'authenticated',
    );

    if (status === 'loading') return <LoadingState />;
    if (status === 'authenticated' && !onboardingGate.ready)
        return <LoadingState />;
    if (status === 'authenticated' && onboardingGate.shouldShowOnboarding)
        return <OnboardingPage />;
    return status === 'authenticated' ? <CommandCenterPage /> : <SignInPage />;
}
