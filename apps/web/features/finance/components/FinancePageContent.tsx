'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/features/ui/components/Header';
import { useFinanceAccounts } from '@/features/finance/hooks/useFinanceAccounts';
import { useFinanceTransactions } from '@/features/finance/hooks/useFinanceTransactions';
import { useFinanceSubscriptions } from '@/features/finance/hooks/useFinanceSubscriptions';
import { useToastContext } from '@/features/finance/components/ToastProvider';
import { NetWorthSummary } from '@/features/finance/components/NetWorthSummary';
import { AccountList } from '@/features/finance/components/AccountList';
import { TransactionList } from '@/features/finance/components/TransactionList';
import { SubscriptionList } from '@/features/finance/components/SubscriptionList';
import { WatchlistTab } from '@/features/finance/components/watchlist/WatchlistTab';
import { FinanceOverviewInsights } from '@/features/finance/components/FinanceOverviewInsights';
import { FinanceAutomationPanel } from '@/features/finance/components/FinanceAutomationPanel';
import { FinancePrivacyToggle } from '@/features/finance/components/FinancePrivacyToggle';
import { useFinancePrivacy } from '@/features/finance/hooks/useFinancePrivacy';
import { AnomalyAlertBanner } from '@/features/finance/components/AnomalyAlertBanner';

const TABS = [
    'Overview',
    'Accounts',
    'Transactions',
    'Subscriptions',
    'Watchlist',
] as const;
type Tab = (typeof TABS)[number];

const VALID_TABS = new Set<string>(TABS);

function coerceTab(raw: string | null): Tab {
    if (raw && VALID_TABS.has(raw)) return raw as Tab;
    return 'Overview';
}

export function FinancePageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const toast = useToastContext();
    const [activeTab, setActiveTab] = useState<Tab>(() =>
        coerceTab(searchParams.get('tab')),
    );
    const [pendingAction, setPendingAction] = useState<string | null>(() =>
        searchParams.get('action'),
    );

    const {
        accounts,
        loading: accsLoading,
        createAccount,
        updateAccount,
        deleteAccount,
    } = useFinanceAccounts();
    const {
        transactions,
        loading: txsLoading,
        createTransaction,
        updateTransaction,
        deleteTransaction,
    } = useFinanceTransactions();
    const {
        subscriptions,
        loading: subsLoading,
        monthlyTotal,
        createSubscription,
        updateSubscription,
        deleteSubscription,
    } = useFinanceSubscriptions();

    const {
        settings: privacySettings,
        update: updatePrivacy,
        amountClassName,
    } = useFinancePrivacy();

    const loading = accsLoading || txsLoading || subsLoading;

    const formatAmount = (
        value: number,
        currency = 'USD',
        maximumFractionDigits = 2,
    ) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits,
        }).format(value);
    };

    const handleAddAccount = async (
        input: Parameters<typeof createAccount>[0],
    ) => {
        try {
            await createAccount(input);
            toast.success('Account created successfully');
            setPendingAction(null);
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to create account',
            );
        }
    };

    const handleUpdateAccount = async (
        id: string,
        input: Parameters<typeof updateAccount>[1],
    ) => {
        try {
            await updateAccount(id, input);
            toast.success('Account updated successfully');
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to update account',
            );
        }
    };

    const handleAddTransaction = async (
        input: Parameters<typeof createTransaction>[0],
    ) => {
        try {
            await createTransaction(input);
            toast.success('Transaction created successfully');
            setPendingAction(null);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to create transaction',
            );
        }
    };

    const handleUpdateTransaction = async (
        id: string,
        input: Parameters<typeof updateTransaction>[1],
    ) => {
        try {
            await updateTransaction(id, input);
            toast.success('Transaction updated successfully');
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to update transaction',
            );
        }
    };

    const handleAddSubscription = async (
        input: Parameters<typeof createSubscription>[0],
    ) => {
        try {
            await createSubscription(input);
            toast.success('Subscription created successfully');
            setPendingAction(null);
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to create subscription',
            );
        }
    };

    const handleUpdateSubscription = async (
        id: string,
        input: Parameters<typeof updateSubscription>[1],
    ) => {
        try {
            await updateSubscription(id, input);
            toast.success('Subscription updated successfully');
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to update subscription',
            );
        }
    };

    const handleDeleteAccount = async (id: string) => {
        try {
            await deleteAccount(id);
            toast.success('Account deleted successfully');
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to delete account',
            );
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        try {
            await deleteTransaction(id);
            toast.success('Transaction deleted successfully');
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to delete transaction',
            );
        }
    };

    const handleDeleteSubscription = async (id: string) => {
        try {
            await deleteSubscription(id);
            toast.success('Subscription deleted successfully');
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to delete subscription',
            );
        }
    };

    const navigateTab = (tab: Tab) => {
        setActiveTab(tab);
        router.push(`/finance?tab=${tab}`, { scroll: false });
    };

    return (
        <>
            <Header />
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                            Finance
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                            Manual-first finance, deterministic insights, and
                            automation-ready actions.
                        </p>
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-emerald-500 dark:text-emerald-400 rounded-full border border-emerald-500/30 px-3 py-1">
                        Private by default
                    </div>
                </div>

                <FinancePrivacyToggle
                    settings={privacySettings}
                    onChange={updatePrivacy}
                />

                <AnomalyAlertBanner transactions={transactions} />

                {activeTab === 'Overview' && !accsLoading && (
                    <NetWorthSummary
                        accounts={accounts}
                        formatAmount={formatAmount}
                        amountClassName={amountClassName}
                    />
                )}

                <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto scrollbar-none">
                    {TABS.map((t) => (
                        <button
                            key={t}
                            onClick={() => navigateTab(t)}
                            className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === t ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400' : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="pt-1">
                    {activeTab === 'Overview' && (
                        <div className="space-y-4">
                            <FinanceOverviewInsights
                                accounts={accounts}
                                transactions={transactions}
                                subscriptions={subscriptions}
                                formatAmount={formatAmount}
                                amountClassName={amountClassName}
                                onSeeAllTransactions={() =>
                                    navigateTab('Transactions')
                                }
                                onSeeAllSubscriptions={() =>
                                    navigateTab('Subscriptions')
                                }
                            />
                            <div className="grid gap-4 md:grid-cols-2">
                                <AccountList
                                    accounts={accounts.slice(0, 5)}
                                    onAdd={handleAddAccount}
                                    onUpdate={handleUpdateAccount}
                                    onDelete={handleDeleteAccount}
                                    formatAmount={formatAmount}
                                    amountClassName={amountClassName}
                                    showSeeAll={accounts.length > 5}
                                    onSeeAll={() => navigateTab('Accounts')}
                                    autoOpenAdd={
                                        activeTab === 'Overview' &&
                                        pendingAction === 'add'
                                    }
                                />
                                <SubscriptionList
                                    subscriptions={subscriptions.slice(0, 5)}
                                    monthlyTotal={monthlyTotal}
                                    onAdd={handleAddSubscription}
                                    onUpdate={handleUpdateSubscription}
                                    onDelete={handleDeleteSubscription}
                                    formatAmount={formatAmount}
                                    amountClassName={amountClassName}
                                    showSeeAll={subscriptions.length > 5}
                                    onSeeAll={() =>
                                        navigateTab('Subscriptions')
                                    }
                                    autoOpenAdd={
                                        activeTab === 'Overview' &&
                                        pendingAction === 'add'
                                    }
                                />
                            </div>
                            <FinanceAutomationPanel
                                accounts={accounts}
                                subscriptions={subscriptions}
                            />
                        </div>
                    )}
                    {activeTab === 'Accounts' && (
                        <AccountList
                            accounts={accounts}
                            onAdd={handleAddAccount}
                            onUpdate={handleUpdateAccount}
                            onDelete={handleDeleteAccount}
                            formatAmount={formatAmount}
                            amountClassName={amountClassName}
                            autoOpenAdd={pendingAction === 'add'}
                        />
                    )}
                    {activeTab === 'Transactions' ? (
                        loading ? (
                            <div className="text-center py-8 text-gray-400">
                                Loading transactions...
                            </div>
                        ) : (
                            <TransactionList
                                accounts={accounts}
                                transactions={transactions}
                                onAdd={handleAddTransaction}
                                onUpdate={handleUpdateTransaction}
                                onDelete={handleDeleteTransaction}
                                formatAmount={formatAmount}
                                amountClassName={amountClassName}
                                autoOpenAdd={pendingAction === 'add'}
                            />
                        )
                    ) : null}
                    {activeTab === 'Subscriptions' && (
                        <SubscriptionList
                            subscriptions={subscriptions}
                            monthlyTotal={monthlyTotal}
                            onAdd={handleAddSubscription}
                            onUpdate={handleUpdateSubscription}
                            onDelete={handleDeleteSubscription}
                            formatAmount={formatAmount}
                            amountClassName={amountClassName}
                            autoOpenAdd={pendingAction === 'add'}
                        />
                    )}
                    {activeTab === 'Watchlist' && <WatchlistTab />}
                </div>
            </div>
        </>
    );
}
