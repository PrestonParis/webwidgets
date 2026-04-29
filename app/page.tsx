'use client';
import Dashboard from '@/components/dashboard/DashboardView';
import SignInPage from '@/components/auth/SignInPage';
import { useAuth } from '@/hooks/auth/useAuth';

// Main page component that conditionally renders either the dashboard or the sign-in page based on authentication status.
export default function Page() {
    const { status } = useAuth();

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }
    return status === 'authenticated' ? <Dashboard /> : <SignInPage />;
}
