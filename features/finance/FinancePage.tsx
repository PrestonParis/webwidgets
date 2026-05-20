'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/features/ui/components/Header';
import { useFinanceAccounts } from '@/features/finance/hooks/useFinanceAccounts';
import { useFinanceTransactions } from '@/features/finance/hooks/useFinanceTransactions';
import { useFinanceSubscriptions } from '@/features/finance/hooks/useFinanceSubscriptions';
import { NetWorthSummary } from '@/features/finance/components/NetWorthSummary';
import { AccountList } from '@/features/finance/components/AccountList';
import { TransactionList } from '@/features/finance/components/TransactionList';
import { SubscriptionList } from '@/features/finance/components/SubscriptionList';
import { WatchlistTab } from '@/features/finance/components/watchlist/WatchlistTab';
import { FinanceOverviewInsights } from '@/features/finance/components/FinanceOverviewInsights';
import { FinanceAutomationPanel } from '@/features/finance/components/FinanceAutomationPanel';
import { FinancePrivacyToggle } from '@/features/finance/components/FinancePrivacyToggle';
import { useFinancePrivacy } from '@/features/finance/hooks/useFinancePrivacy';

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

export function FinancePage() {
    const router = useRouter();
    const searchParams = useSearchParams();
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
        loading: txLoading,
        createTransaction,
        updateTransaction,
        deleteTransaction,
    } = useFinanceTransactions();
    const {
        subscriptions,
        monthlyTotal,
        createSubscription,
        updateSubscription,
        deleteSubscription,
    } = useFinanceSubscriptions();
    const {
        settings: privacySettings,
        update: updatePrivacy,
        formatAmount,
        amountClassName,
    } = useFinancePrivacy();

    useEffect(() => {
        setActiveTab(coerceTab(searchParams.get('tab')));
        setPendingAction(searchParams.get('action'));
    }, [searchParams]);

    const navigateTab = (tab: Tab) => {
        setActiveTab(tab);
        router.replace(`/finance?tab=${tab}`, { scroll: false });
    };

    const handleAddAccount = async (
        input: Parameters<typeof createAccount>[0],
    ) => {
        await createAccount(input);
        setPendingAction(null);
    };
    const handleUpdateAccount = async (
        id: string,
        input: Parameters<typeof updateAccount>[1],
    ) => {
        await updateAccount(id, input);
    };
    const handleAddTransaction = async (
        input: Parameters<typeof createTransaction>[0],
    ) => {
        await createTransaction(input);
        setPendingAction(null);
    };
    const handleUpdateTransaction = async (
        id: string,
        input: Parameters<typeof updateTransaction>[1],
    ) => {
        await updateTransaction(id, input);
    };
    const handleAddSubscription = async (
        input: Parameters<typeof createSubscription>[0],
    ) => {
        await createSubscription(input);
        setPendingAction(null);
    };
    const handleUpdateSubscription = async (
        id: string,
        input: Parameters<typeof updateSubscription>[1],
    ) => {
        await updateSubscription(id, input);
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
                                    onDelete={deleteAccount}
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
                                    onDelete={deleteSubscription}
                                    formatAmount={formatAmount}
                                    amountClassName={amountClassName}
                                    showSeeAll={subscriptions.length > 5}
                                    onSeeAll={() =>
                                        navigateTab('Subscriptions')
                                    }
                                />
                            </div>
                            <FinanceAutomationPanel
                                accounts={accounts}
                                subscriptions={subscriptions}
                            />
                            <FinancePrivacyToggle
                                settings={privacySettings}
                                onChange={updatePrivacy}
                            />
                        </div>
                    )}
                    {activeTab === 'Accounts' && (
                        <AccountList
                            accounts={accounts}
                            onAdd={handleAddAccount}
                            onUpdate={handleUpdateAccount}
                            onDelete={deleteAccount}
                            formatAmount={formatAmount}
                            amountClassName={amountClassName}
                            autoOpenAdd={pendingAction === 'add'}
                        />
                    )}
                    {activeTab === 'Transactions' &&
                        (txLoading ? (
                            <div className="flex justify-center py-10">
                                <div className="w-6 h-6 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                            </div>
                        ) : (
                            <TransactionList
                                accounts={accounts}
                                transactions={transactions}
                                onAdd={handleAddTransaction}
                                onUpdate={handleUpdateTransaction}
                                onDelete={deleteTransaction}
                                formatAmount={formatAmount}
                                amountClassName={amountClassName}
                                autoOpenAdd={pendingAction === 'add'}
                            />
                        ))}
                    {activeTab === 'Subscriptions' && (
                        <SubscriptionList
                            subscriptions={subscriptions}
                            monthlyTotal={monthlyTotal}
                            onAdd={handleAddSubscription}
                            onUpdate={handleUpdateSubscription}
                            onDelete={deleteSubscription}
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
