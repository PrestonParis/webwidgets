import type {
    FinanceAccount,
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';

export function accountPayload(
    input: Partial<Omit<FinanceAccount, 'id' | 'userId'>>,
) {
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

export function transactionPayload(
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

export function subscriptionPayload(
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
