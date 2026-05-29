import { describe, expect, it } from 'vitest';
import {
    calculateFinanceOverview,
    filterToCurrentMonth,
    filterToLastNDays,
    toMonthlySubscriptionAmount,
} from '@/features/finance/lib/financeAggregations';
import type {
    FinanceAccount,
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';

const thisMonthPrefix = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
})();

const account = (overrides: Partial<FinanceAccount>): FinanceAccount => ({
    id: 'a1',
    userId: 'u1',
    name: 'Checking',
    type: 'checking',
    balance: 1000,
    currency: 'USD',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
});

const transaction = (
    overrides: Partial<FinanceTransaction>,
): FinanceTransaction => ({
    id: 't1',
    userId: 'u1',
    accountId: 'a1',
    title: 'Groceries',
    merchant: 'Groceries',
    amount: -100,
    type: 'expense',
    category: 'Food',
    date: `${thisMonthPrefix}-10`,
    recurringCandidate: false,
    createdAt: `${thisMonthPrefix}-10T00:00:00Z`,
    occurredOn: `${thisMonthPrefix}-10`,
    ...overrides,
});

const subscription = (
    overrides: Partial<FinanceSubscription>,
): FinanceSubscription => ({
    id: 's1',
    userId: 'u1',
    name: 'Music',
    amount: 12,
    billingCycle: 'monthly',
    category: 'Entertainment',
    active: true,
    source: 'manual',
    createdAt: '2026-01-01T00:00:00Z',
    cadence: 'monthly',
    ...overrides,
});

describe('finance aggregations', () => {
    it('filters transactions to the current month', () => {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthPrefix = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
        const txs = [
            transaction({ id: 'this', date: `${thisMonthPrefix}-05` }),
            transaction({ id: 'last', date: `${lastMonthPrefix}-05` }),
        ];
        const filtered = filterToCurrentMonth(txs);
        expect(filtered).toHaveLength(1);
        expect(filtered[0]?.id).toBe('this');
    });

    it('filters transactions to the last N days', () => {
        const old = new Date();
        old.setDate(old.getDate() - 60);
        const txs = [
            transaction({ id: 'recent', date: `${thisMonthPrefix}-01` }),
            transaction({ id: 'old', date: old.toISOString().slice(0, 10) }),
        ];
        const filtered = filterToLastNDays(txs, 31);
        expect(filtered.every((tx) => tx.id !== 'old')).toBe(true);
    });

    it('normalizes subscription cycles to monthly cost', () => {
        expect(
            toMonthlySubscriptionAmount(
                subscription({
                    amount: 120,
                    billingCycle: 'yearly',
                    cadence: 'annual',
                }),
            ),
        ).toBe(10);
        expect(
            toMonthlySubscriptionAmount(
                subscription({
                    amount: 10,
                    billingCycle: 'weekly',
                    cadence: 'weekly',
                }),
            ),
        ).toBeCloseTo(43.3);
        expect(
            toMonthlySubscriptionAmount(subscription({ active: false })),
        ).toBe(0);
    });

    it('calculates overview totals from manual finance data', () => {
        const overview = calculateFinanceOverview(
            [
                account({ id: 'cash', type: 'checking', balance: 1200 }),
                account({ id: 'card', type: 'credit', balance: -300 }),
                account({ id: 'invest', type: 'investment', balance: 2000 }),
            ],
            [
                transaction({
                    id: 'income',
                    amount: 4000,
                    type: 'income',
                    category: 'Income',
                }),
                transaction({
                    id: 'food',
                    amount: -500,
                    type: 'expense',
                    category: 'Food',
                }),
                transaction({
                    id: 'rent',
                    amount: -1500,
                    type: 'expense',
                    category: 'Housing',
                }),
            ],
            [subscription({ amount: 20, billingCycle: 'monthly' })],
        );

        expect(overview.netWorth).toBe(2900);
        expect(overview.cashTotal).toBe(1200);
        expect(overview.debtTotal).toBe(300);
        expect(overview.monthlyIncome).toBe(4000);
        expect(overview.monthlyExpenses).toBe(2000);
        expect(overview.netMonthlyCashflow).toBe(1980);
        expect(overview.topSpendingCategory?.category).toBe('Housing');
    });
});
