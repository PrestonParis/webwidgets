import { db } from '@/lib/db/supabase';
import type {
    FinanceAccount,
    FinanceAccountType,
    FinanceBillingCycle,
    FinanceSubscription,
    FinanceSubscriptionSource,
    FinanceTransaction,
    FinanceTransactionType,
} from '@/features/finance/types/finance';
import type { SupabaseClient } from '@supabase/supabase-js';

type DbRow = Record<string, unknown>;

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

function rowToAccount(row: DbRow): FinanceAccount {
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

function rowToTransaction(row: DbRow): FinanceTransaction {
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

function rowToSubscription(row: DbRow): FinanceSubscription {
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

function accountPayload(input: Partial<Omit<FinanceAccount, 'id' | 'userId'>>) {
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.type !== undefined) payload.type = input.type;
    if (input.currency !== undefined) payload.currency = input.currency;
    if (input.balance !== undefined) payload.balance = input.balance;
    if (input.institution !== undefined) {
        payload.institution = input.institution;
        payload.metadata = { institution: input.institution };
    }
    return payload;
}

function transactionPayload(
    input: Partial<
        Omit<FinanceTransaction, 'id' | 'userId' | 'createdAt' | 'occurredOn'>
    >,
) {
    const payload: Record<string, unknown> = {};
    if (input.accountId !== undefined)
        payload.account_id = input.accountId || null;
    if (input.amount !== undefined) payload.amount = input.amount;
    if (input.category !== undefined) payload.category = input.category;
    if (input.date !== undefined) payload.occurred_on = input.date;
    if (input.title !== undefined) {
        payload.title = input.title;
        payload.merchant = input.title;
    }
    if (input.merchant !== undefined) payload.merchant = input.merchant;
    if (input.type !== undefined) payload.type = input.type;
    if (input.notes !== undefined) payload.notes = input.notes;
    if (input.recurringCandidate !== undefined)
        payload.recurring_candidate = input.recurringCandidate;
    const metadata: Record<string, unknown> = {};
    if (input.title !== undefined) metadata.title = input.title;
    if (input.notes !== undefined) metadata.notes = input.notes;
    if (input.recurringCandidate !== undefined)
        metadata.recurringCandidate = input.recurringCandidate;
    if (input.type !== undefined) metadata.type = input.type;
    if (Object.keys(metadata).length > 0) payload.metadata = metadata;
    return payload;
}

function subscriptionPayload(
    input: Partial<
        Omit<
            FinanceSubscription,
            'id' | 'userId' | 'createdAt' | 'cadence' | 'nextChargeOn'
        >
    >,
) {
    const payload: Record<string, unknown> = {};
    const billingCycle = input.billingCycle;
    if (input.name !== undefined) payload.name = input.name;
    if (input.amount !== undefined) payload.amount = input.amount;
    if (billingCycle !== undefined) {
        payload.billing_cycle = billingCycle;
        payload.cadence = billingCycle === 'yearly' ? 'annual' : billingCycle;
    }
    if (input.nextBillingDate !== undefined) {
        payload.next_billing_date = input.nextBillingDate || null;
        payload.next_charge_on = input.nextBillingDate || null;
    }
    if (input.category !== undefined) payload.category = input.category;
    if (input.active !== undefined) payload.active = input.active;
    if (input.source !== undefined) payload.source = input.source;
    const metadata: Record<string, unknown> = {};
    if (input.category !== undefined) metadata.category = input.category;
    if (input.active !== undefined) metadata.active = input.active;
    if (input.source !== undefined) metadata.source = input.source;
    if (billingCycle !== undefined) metadata.billingCycle = billingCycle;
    if (Object.keys(metadata).length > 0) payload.metadata = metadata;
    return payload;
}

export async function listFinanceAccounts(userId: string) {
    const result = await db
        .from('finance_accounts')
        .select('*')
        .eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []).map((row) => rowToAccount(row as DbRow));
}

export async function listFinanceTransactions(userId: string) {
    const result = await db
        .from('finance_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_on', { ascending: false });
    if (result.error) throw result.error;
    return (result.data ?? []).map((row) => rowToTransaction(row as DbRow));
}

export async function listFinanceSubscriptions(userId: string) {
    const result = await db
        .from('finance_subscriptions')
        .select('*')
        .eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []).map((row) => rowToSubscription(row as DbRow));
}

export async function createFinanceAccount(
    input: Omit<FinanceAccount, 'id' | 'createdAt' | 'updatedAt'>,
) {
    const result = await db
        .from('finance_accounts')
        .insert({ user_id: input.userId, ...accountPayload(input) })
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToAccount(result.data as DbRow);
}

export async function listFinanceAccountsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []).map((row) => rowToAccount(row as DbRow));
}

export async function createFinanceAccountForUser(
    supabase: SupabaseClient,
    input: Omit<FinanceAccount, 'id' | 'createdAt' | 'updatedAt'>,
) {
    const result = await supabase
        .from('finance_accounts')
        .insert({ user_id: input.userId, ...accountPayload(input) })
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToAccount(result.data as DbRow);
}

export async function updateFinanceAccountForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    updates: Partial<
        Omit<FinanceAccount, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    >,
) {
    const result = await supabase
        .from('finance_accounts')
        .update(accountPayload(updates))
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToAccount(result.data as DbRow);
}

export async function deleteFinanceAccountForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
) {
    const { error } = await supabase
        .from('finance_accounts')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw error;
}

export async function listFinanceTransactionsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('finance_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('occurred_on', { ascending: false })
        .limit(100);
    if (result.error) throw result.error;
    return (result.data ?? []).map((row) => rowToTransaction(row as DbRow));
}

export async function createFinanceTransactionForUser(
    supabase: SupabaseClient,
    input: Omit<FinanceTransaction, 'id' | 'createdAt' | 'occurredOn'>,
) {
    const result = await supabase
        .from('finance_transactions')
        .insert({ user_id: input.userId, ...transactionPayload(input) })
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToTransaction(result.data as DbRow);
}

export async function updateFinanceTransactionForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    updates: Partial<
        Omit<FinanceTransaction, 'id' | 'userId' | 'createdAt' | 'occurredOn'>
    >,
) {
    const result = await supabase
        .from('finance_transactions')
        .update(transactionPayload(updates))
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToTransaction(result.data as DbRow);
}

export async function deleteFinanceTransactionForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
) {
    const { error } = await supabase
        .from('finance_transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw error;
}

export async function listFinanceSubscriptionsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('finance_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return (result.data ?? []).map((row) => rowToSubscription(row as DbRow));
}

export async function createFinanceSubscriptionForUser(
    supabase: SupabaseClient,
    input: Omit<
        FinanceSubscription,
        'id' | 'createdAt' | 'cadence' | 'nextChargeOn'
    >,
) {
    const result = await supabase
        .from('finance_subscriptions')
        .insert({ user_id: input.userId, ...subscriptionPayload(input) })
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToSubscription(result.data as DbRow);
}

export async function updateFinanceSubscriptionForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    updates: Partial<
        Omit<
            FinanceSubscription,
            'id' | 'userId' | 'createdAt' | 'cadence' | 'nextChargeOn'
        >
    >,
) {
    const result = await supabase
        .from('finance_subscriptions')
        .update(subscriptionPayload(updates))
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();
    if (result.error) throw result.error;
    return rowToSubscription(result.data as DbRow);
}

export async function deleteFinanceSubscriptionForUser(
    supabase: SupabaseClient,
    userId: string,
    id: string,
) {
    const { error } = await supabase
        .from('finance_subscriptions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
    if (error) throw error;
}
