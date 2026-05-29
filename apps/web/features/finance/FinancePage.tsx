'use client';

import { ToastProvider } from '@/features/finance/components/ToastProvider';
import { ErrorBoundary } from '@/features/finance/components/ErrorBoundary';
import { FinancePageContent } from '@/features/finance/components/FinancePageContent';

export function FinancePage() {
    return (
        <ToastProvider>
            <ErrorBoundary>
                <FinancePageContent />
            </ErrorBoundary>
        </ToastProvider>
    );
}
