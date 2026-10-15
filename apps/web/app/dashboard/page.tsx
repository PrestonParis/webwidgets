import { Suspense } from 'react';
import Dashboard from '@/features/dashboard/components/DashboardView';
import LoadingState from '@/features/ui/components/LoadingState';

export default function DashboardPage() {
    return (
        <Suspense fallback={<LoadingState />}>
            <Dashboard />
        </Suspense>
    );
}
