import { describe, expect, it } from 'vitest';
import {
    detectRecurringTransactions,
    predictCashflowRisk,
    suggestTransactionCategory,
} from '@/features/finance/lib/financePredictions';
import type {
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';

const tx = (overrides: Partial<FinanceTransaction>): FinanceTransaction => ({
    id: 't1',
    userId: 'u1',
    accountId: 'a1',
    title: 'Apple',
    merchant: 'Apple',
    amount: -9.99,
    type: 'expense',
    category: 'Subscriptions',
    date: '2026-01-01',
    recurringCandidate: false,
    createdAt: '2026-01-01T00:00:00Z',
    occurredOn: '2026-01-01',
    ...overrides,
});

const sub = (overrides: Partial<FinanceSubscription>): FinanceSubscription => ({
    id: 's1',
    userId: 'u1',
    name: 'Cloud',
    amount: 20,
    billingCycle: 'monthly',
    category: 'Software',
    active: true,
    source: 'manual',
    createdAt: '2026-01-01T00:00:00Z',
    cadence: 'monthly',
    ...overrides,
});

describe('finance predictions', () => {
    it('detects recurring transactions deterministically', () => {
        const predictions = detectRecurringTransactions([
            tx({ id: 'a', date: '2026-01-01' }),
            tx({ id: 'b', date: '2026-02-01' }),
        ]);

        expect(predictions[0]?.label).toBe('Recurring transaction candidate');
        expect(predictions[0]?.confidence).toBeGreaterThan(0.7);
    });

    it('classifies obvious transaction categories without claiming ML', () => {
        expect(suggestTransactionCategory('Whole Foods Market').label).toBe(
            'Groceries',
        );
        expect(
            suggestTransactionCategory('Mystery Store').confidence,
        ).toBeLessThan(0.5);
    });

    it('flags negative projected cashflow risk', () => {
        const risk = predictCashflowRisk(
            [
                tx({
                    id: 'income',
                    title: 'Payroll',
                    amount: 1000,
                    type: 'income',
                }),
                tx({ id: 'rent', amount: -1200, type: 'expense' }),
            ],
            [sub({ amount: 50 })],
        );

        expect(risk.label).toBe('Cashflow risk');
    });
});
