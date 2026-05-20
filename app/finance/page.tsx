import { Suspense } from 'react';
import { FinancePage } from '@/features/finance/FinancePage';

export default function Page() {
    return (
        <Suspense>
            <FinancePage />
        </Suspense>
    );
}
