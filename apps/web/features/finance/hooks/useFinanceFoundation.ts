import { FINANCE_WIDGETS } from '@/features/finance/lib/financeRegistry';

export function useFinanceFoundation() {
    return { widgets: FINANCE_WIDGETS };
}
