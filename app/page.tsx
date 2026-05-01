'use client';
import Dashboard from '@/features/dashboard/components/DashboardView';
import SignInPage from '@/features/auth/components/SignInPage';
import { useAuth } from '@/features/auth/hooks/useAuth';
import LoadingState from '@/features/ui/components/LoadingState';

// Main page component that conditionally renders either the dashboard or the sign-in page based on authentication status.
export default function Page() {
    const { status } = useAuth();

    if (status === 'loading') return <LoadingState />;
    return status === 'authenticated' ? <Dashboard /> : <SignInPage />;
}
