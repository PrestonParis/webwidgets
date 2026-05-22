import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { PageLoading } from '@/features/ui/loading';

const FinancePage = dynamic(
    () =>
        import('@/features/finance/FinancePage').then(
            (module) => module.FinancePage,
        ),
    { loading: () => <PageLoading message="Loading finance" /> },
);

export default function Page() {
    return (
        <Suspense fallback={<PageLoading message="Loading finance" />}>
            <FinancePage />
        </Suspense>
    );
}
