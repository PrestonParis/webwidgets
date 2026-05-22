'use client';
import Dashboard from '@/features/dashboard/components/DashboardView';
import SignInPage from '@/features/auth/components/SignInPage';
import { useAuth } from '@/features/auth/hooks/useAuth';
import LoadingState from '@/features/ui/components/LoadingState';
import { OnboardingPage } from '@/features/onboarding/OnboardingPage';
import { useOnboardingGate } from '@/features/onboarding/hooks/useOnboardingGate';

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
    return status === 'authenticated' ? <Dashboard /> : <SignInPage />;
}
