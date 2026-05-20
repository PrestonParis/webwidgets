export type FinanceAccountType =
    | 'cash'
    | 'checking'
    | 'savings'
    | 'credit'
    | 'investment'
    | 'loan'
    | 'other';
export type FinanceTransactionType = 'income' | 'expense' | 'transfer';
export type FinanceBillingCycle = 'monthly' | 'yearly' | 'weekly' | 'custom';
export type FinanceSubscriptionSource =
    | 'manual'
    | 'detected'
    | 'email'
    | 'bank';
export type FinanceAutomationType =
    | 'subscription_reminder'
    | 'low_balance'
    | 'high_spending'
    | 'savings_goal_progress'
    | 'price_target';

export interface FinanceAccount {
    id: string;
    userId: string;
    name: string;
    type: FinanceAccountType;
    balance: number;
    currency: string;
    institution?: string | undefined;
    createdAt: string;
    updatedAt: string;
}

export interface FinanceTransaction {
    id: string;
    userId: string;
    accountId: string;
    title: string;
    merchant?: string | undefined;
    amount: number;
    type: FinanceTransactionType;
    category: string;
    date: string;
    notes?: string | undefined;
    recurringCandidate: boolean;
    createdAt: string;
    occurredOn: string;
}

export interface FinanceSubscription {
    id: string;
    userId: string;
    name: string;
    amount: number;
    billingCycle: FinanceBillingCycle;
    nextBillingDate?: string | undefined;
    category: string;
    active: boolean;
    source: FinanceSubscriptionSource;
    createdAt: string;
    cadence: 'weekly' | 'monthly' | 'annual' | 'yearly' | 'custom';
    nextChargeOn?: string | undefined;
}

export interface PortfolioHolding {
    id: string;
    userId: string;
    symbol: string;
    quantity: number;
    costBasis?: number;
}

export interface FinanceAutomationRule {
    id: string;
    type: FinanceAutomationType;
    label: string;
    enabled: boolean;
    conditions: Record<string, unknown>;
    action: Record<string, unknown>;
}
