import type {
    FinanceAccount,
    FinanceAccountType,
    FinanceBillingCycle,
    FinanceSubscription,
    FinanceSubscriptionSource,
    FinanceTransaction,
    FinanceTransactionType,
} from '@/features/finance/types/finance';

export type DbRow = Record<string, unknown>;

const ACCOUNT_TYPES = new Set<FinanceAccountType>([
    'cash',
    'checking',
    'savings',
    'credit',
    'investment',
    'loan',
    'other',
]);
const TRANSACTION_TYPES = new Set<FinanceTransactionType>([
    'income',
    'expense',
    'transfer',
]);
const BILLING_CYCLES = new Set<FinanceBillingCycle>([
    'monthly',
    'yearly',
    'weekly',
    'custom',
]);

const metadataOf = (row: DbRow) =>
    row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : {};
const asString = (value: unknown, fallback = '') =>
    typeof value === 'string' && value.length > 0 ? value : fallback;
const asNumber = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};
const nowIso = () => new Date().toISOString();

function normalizeAccountType(type: unknown): FinanceAccountType {
    const raw = asString(type, 'cash');
    if (raw === 'asset') return 'other';
    const value = raw as FinanceAccountType;
    if (ACCOUNT_TYPES.has(value)) return value;
    return 'cash';
}

function normalizeBillingCycle(value: unknown): FinanceBillingCycle {
    if (value === 'annual') return 'yearly';
    const cycle = asString(value, 'monthly') as FinanceBillingCycle;
    return BILLING_CYCLES.has(cycle) ? cycle : 'monthly';
}

export function rowToAccount(row: DbRow): FinanceAccount {
    const metadata = metadataOf(row);
    const createdAt = asString(row.created_at, nowIso());
    return {
        id: asString(row.id),
        userId: asString(row.user_id),
        name: asString(row.name, 'Account'),
        type: normalizeAccountType(row.type),
        balance: asNumber(row.balance),
        currency: asString(row.currency, 'USD'),
        institution: asString(row.institution ?? metadata.institution, ''),
        createdAt,
        updatedAt: asString(row.updated_at, createdAt),
    };
}

export function rowToTransaction(row: DbRow): FinanceTransaction {
    const metadata = metadataOf(row);
    const amount = asNumber(row.amount);
    const type = TRANSACTION_TYPES.has(row.type as FinanceTransactionType)
        ? (row.type as FinanceTransactionType)
        : amount > 0
          ? 'income'
          : 'expense';
    const title = asString(
        row.title ?? row.merchant ?? metadata.title,
        asString(row.category, 'Transaction'),
    );
    const date = asString(row.date ?? row.occurred_on, '');

    return {
        id: asString(row.id),
        userId: asString(row.user_id),
        accountId: asString(row.account_id),
        title,
        merchant: asString(row.merchant, title),
        amount,
        type,
        category: asString(row.category, 'Uncategorized'),
        date,
        notes: asString(row.notes ?? metadata.notes, ''),
        recurringCandidate: Boolean(
            row.recurring_candidate ?? metadata.recurringCandidate ?? false,
        ),
        createdAt: asString(row.created_at, nowIso()),
        occurredOn: date,
    };
}

export function rowToSubscription(row: DbRow): FinanceSubscription {
    const metadata = metadataOf(row);
    const billingCycle = normalizeBillingCycle(
        row.billing_cycle ?? metadata.billingCycle ?? row.cadence,
    );
    const nextBillingDate = asString(
        row.next_billing_date ?? row.next_charge_on,
        '',
    );
    const source = asString(
        row.source ?? metadata.source,
        'manual',
    ) as FinanceSubscriptionSource;

    return {
        id: asString(row.id),
        userId: asString(row.user_id),
        name: asString(row.name, 'Subscription'),
        amount: asNumber(row.amount),
        billingCycle,
        nextBillingDate,
        category: asString(row.category ?? metadata.category, 'Subscriptions'),
        active:
            row.active === undefined
                ? metadata.active !== undefined
                    ? Boolean(metadata.active)
                    : true
                : Boolean(row.active),
        source,
        createdAt: asString(row.created_at, nowIso()),
        cadence: billingCycle === 'yearly' ? 'annual' : billingCycle,
        nextChargeOn: nextBillingDate,
    };
}
