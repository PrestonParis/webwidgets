'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Lock, LockOpen, Blend } from 'lucide-react';
import Header from '@/features/ui/components/Header';
import { useFinanceAccounts } from '@/features/finance/hooks/useFinanceAccounts';
import { useFinanceTransactions } from '@/features/finance/hooks/useFinanceTransactions';
import { useFinanceSubscriptions } from '@/features/finance/hooks/useFinanceSubscriptions';
import { useToastContext } from '@/features/finance/components/ToastProvider';
import { useFinancePrivacy } from '@/features/finance/hooks/useFinancePrivacy';
import { AnomalyAlertBanner } from '@/features/finance/components/AnomalyAlertBanner';
import { FinanceCommandCenter } from '@/features/finance/components/FinanceCommandCenter';
import { AccountList } from '@/features/finance/components/AccountList';
import { TransactionList } from '@/features/finance/components/TransactionList';
import { SubscriptionList } from '@/features/finance/components/SubscriptionList';
import { WatchlistTab } from '@/features/finance/components/watchlist/WatchlistTab';
import { FinanceOverviewInsights } from '@/features/finance/components/FinanceOverviewInsights';
import { SpendingAnalysis } from '@/features/finance/components/SpendingAnalysis';
import { CashflowForecast } from '@/features/finance/components/CashflowForecast';
import { SubscriptionIntelligence } from '@/features/finance/components/SubscriptionIntelligence';
import { GoalsPanel } from '@/features/finance/components/GoalsPanel';
import { FinanceTimeline } from '@/features/finance/components/FinanceTimeline';
import {
    calculateFinanceOverview,
    calculateSavingsRate,
} from '@/features/finance/lib/financeAggregations';

const TABS = [
    'Overview',
    'Accounts',
    'Spending',
    'Forecast',
    'Goals',
    'Watchlist',
] as const;
type Tab = (typeof TABS)[number];

const VALID_TABS = new Set<string>(TABS);

function coerceTab(raw: string | null): Tab {
    if (raw && VALID_TABS.has(raw)) return raw as Tab;
    return 'Overview';
}

const TAB_SUBTITLES: Record<Tab, string> = {
    Overview: 'What is my financial position?',
    Accounts: 'What do I own and what do I owe?',
    Spending: 'Where is my money going?',
    Forecast: 'What is about to happen?',
    Goals: 'What should I change?',
    Watchlist: 'Asset prices',
};

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
    ) =>
        new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            maximumFractionDigits,
        }).format(value);

    const handleAddAccount = async (
        input: Parameters<typeof createAccount>[0],
    ) => {
        try {
            await createAccount(input);
            toast.success('Account created');
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
            toast.success('Account updated');
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
            toast.success('Transaction created');
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
            toast.success('Transaction updated');
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
            toast.success('Subscription created');
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
            toast.success('Subscription updated');
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
            toast.success('Account deleted');
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Failed to delete account',
            );
        }
    };

    const handleDeleteTransaction = async (id: string) => {
        try {
            await deleteTransaction(id);
            toast.success('Transaction deleted');
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
            toast.success('Subscription deleted');
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

    const overview = calculateFinanceOverview(
        accounts,
        transactions,
        subscriptions,
    );
    const monthlySavings = Math.max(0, overview.netMonthlyCashflow);
    const savingsRate = calculateSavingsRate(transactions);

    return (
        <>
            <Header />
            <div className="max-w-5xl mx-auto px-4 py-8 space-y-5">
                {/* Page header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                            Finance
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
                            {TAB_SUBTITLES[activeTab]}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            title={
                                privacySettings.hideBalances
                                    ? 'Show balances'
                                    : 'Hide balances'
                            }
                            onClick={() =>
                                updatePrivacy({
                                    hideBalances: !privacySettings.hideBalances,
                                })
                            }
                            className={`p-2 rounded-lg border transition-colors ${privacySettings.hideBalances ? 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-gray-200 text-gray-400 hover:border-gray-300 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700'}`}
                        >
                            {privacySettings.hideBalances ? (
                                <EyeOff size={14} />
                            ) : (
                                <Eye size={14} />
                            )}
                        </button>
                        <button
                            title={
                                privacySettings.blurAmounts
                                    ? 'Disable blur'
                                    : 'Blur until hover'
                            }
                            onClick={() =>
                                updatePrivacy({
                                    blurAmounts: !privacySettings.blurAmounts,
                                })
                            }
                            className={`p-2 rounded-lg border transition-colors ${privacySettings.blurAmounts ? 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-gray-200 text-gray-400 hover:border-gray-300 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700'}`}
                        >
                            <Blend size={14} />
                        </button>
                        <button
                            title={
                                privacySettings.lowProfileMode
                                    ? 'Disable low profile'
                                    : 'Low profile mode'
                            }
                            onClick={() =>
                                updatePrivacy({
                                    lowProfileMode:
                                        !privacySettings.lowProfileMode,
                                })
                            }
                            className={`p-2 rounded-lg border transition-colors ${privacySettings.lowProfileMode ? 'border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' : 'border-gray-200 text-gray-400 hover:border-gray-300 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-700'}`}
                        >
                            {privacySettings.lowProfileMode ? (
                                <Lock size={14} />
                            ) : (
                                <LockOpen size={14} />
                            )}
                        </button>
                        <div className="text-[10px] uppercase tracking-widest text-emerald-500 dark:text-emerald-400 rounded-full border border-emerald-500/30 px-3 py-1">
                            Private by default
                        </div>
                    </div>
                </div>

                <AnomalyAlertBanner transactions={transactions} />

                {/* Command center — always visible */}
                {!accsLoading && (
                    <FinanceCommandCenter
                        accounts={accounts}
                        transactions={transactions}
                        subscriptions={subscriptions}
                        formatAmount={formatAmount}
                        amountClassName={amountClassName}
                    />
                )}

                {/* Tabs */}
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
                    {/* Overview — intelligence layer */}
                    {activeTab === 'Overview' && (
                        <div className="space-y-4">
                            <FinanceOverviewInsights
                                accounts={accounts}
                                transactions={transactions}
                                subscriptions={subscriptions}
                                formatAmount={formatAmount}
                                amountClassName={amountClassName}
                                onSeeAllTransactions={() =>
                                    navigateTab('Spending')
                                }
                                onSeeAllSubscriptions={() =>
                                    navigateTab('Forecast')
                                }
                                onAddAccount={() => {
                                    navigateTab('Accounts');
                                    setPendingAction('add');
                                }}
                                onAddTransaction={() => {
                                    navigateTab('Spending');
                                    setPendingAction('add');
                                }}
                                onAddSubscription={() => {
                                    navigateTab('Forecast');
                                    setPendingAction('add');
                                }}
                            />
                            <FinanceTimeline
                                transactions={transactions}
                                subscriptions={subscriptions}
                                formatAmount={formatAmount}
                                amountClassName={amountClassName}
                            />
                        </div>
                    )}

                    {/* Accounts — what do I own / owe */}
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

                    {/* Spending — where is my money going */}
                    {activeTab === 'Spending' && (
                        <div className="space-y-4">
                            <SpendingAnalysis
                                transactions={transactions}
                                formatAmount={formatAmount}
                                amountClassName={amountClassName}
                            />
                            {loading ? (
                                <div className="text-center py-8 text-gray-400">
                                    Loading...
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
                            )}
                        </div>
                    )}

                    {/* Forecast — what is about to happen */}
                    {activeTab === 'Forecast' && (
                        <div className="space-y-4">
                            <CashflowForecast
                                accounts={accounts}
                                transactions={transactions}
                                subscriptions={subscriptions}
                                formatAmount={formatAmount}
                                amountClassName={amountClassName}
                            />
                            <SubscriptionIntelligence
                                subscriptions={subscriptions}
                                formatAmount={formatAmount}
                                amountClassName={amountClassName}
                                onManage={() => navigateTab('Forecast')}
                            />
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
                        </div>
                    )}

                    {/* Goals — what should I change */}
                    {activeTab === 'Goals' && (
                        <div className="space-y-4">
                            <GoalsPanel
                                monthlySavings={monthlySavings}
                                formatAmount={formatAmount}
                                amountClassName={amountClassName}
                            />
                            <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
                                <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1">
                                    Current savings rate
                                </p>
                                <p
                                    className={`text-2xl font-bold ${savingsRate >= 20 ? 'text-emerald-400' : savingsRate >= 5 ? 'text-amber-400' : 'text-red-400'}`}
                                >
                                    {savingsRate}%
                                </p>
                                <p className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
                                    Target 20%+ for strong long-term trajectory
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Watchlist */}
                    {activeTab === 'Watchlist' && <WatchlistTab />}
                </div>
            </div>
        </>
    );
}
