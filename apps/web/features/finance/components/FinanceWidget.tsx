'use client';

import WidgetShell from '@/features/widgets/components/WidgetShell';
import { WidgetLoading } from '@/features/ui/loading';
import { useFinanceAccounts } from '@/features/finance/hooks/useFinanceAccounts';
import { useFinanceSubscriptions } from '@/features/finance/hooks/useFinanceSubscriptions';
import { useFinanceTransactions } from '@/features/finance/hooks/useFinanceTransactions';
import { calculateFinanceOverview } from '@/features/finance/lib/financeAggregations';
import { suggestFinanceActions } from '@/features/finance/lib/financePredictions';
import { useFinancePrivacy } from '@/features/finance/hooks/useFinancePrivacy';
import { useWidgetSnapshot } from '@/features/dashboard/lib/DashboardSnapshotContext';
import type { FinanceSummary } from '@/features/finance/server/financeResolvers';

const LIABILITY_TYPES = ['credit', 'loan'];

export default function FinanceWidget({
    widgetId = 'widget-finance',
}: {
    widgetId?: string;
}) {
    const snapshot = useWidgetSnapshot<FinanceSummary>(widgetId);
    const { accounts, loading: accsLoading } = useFinanceAccounts();
    const { transactions } = useFinanceTransactions();
    const { subscriptions, monthlyTotal } = useFinanceSubscriptions();
    const { formatAmount, amountClassName } = useFinancePrivacy();

    const snapshotData =
        snapshot?.status === 'ready' ? snapshot.data : undefined;
    const overview =
        snapshotData?.overview ??
        calculateFinanceOverview(accounts, transactions, subscriptions);
    const action =
        snapshotData?.action ??
        suggestFinanceActions(accounts, transactions, subscriptions)[0];
    const topAccounts =
        snapshotData?.topAccounts ??
        accounts.filter((a) => !LIABILITY_TYPES.includes(a.type)).slice(0, 3);
    const subscriptionTotal = snapshotData?.monthlyTotal ?? monthlyTotal;
    const accountCount = snapshotData?.accountCount ?? accounts.length;
    const loading = !snapshotData && accsLoading;

    return (
        <WidgetShell
            icon={<span className="text-base">💰</span>}
            title="Finance"
            footerHref="/finance"
            footerLabel="Open Finance →"
            widgetId={widgetId}
            widgetType="finance"
        >
            {loading ? (
                <WidgetLoading variant="compact" showHeader={false} />
            ) : snapshot?.status === 'error' && !snapshotData ? (
                <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-4">
                    {snapshot.error?.message ??
                        'Finance data is temporarily unavailable.'}
                </p>
            ) : (
                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500 uppercase tracking-wider">
                            Net Worth
                        </p>
                        <p
                            className={`text-2xl font-bold ${amountClassName} ${overview.netWorth >= 0 ? 'text-gray-900 dark:text-zinc-100' : 'text-red-500'}`}
                        >
                            {formatAmount(overview.netWorth)}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <MiniMetric
                            label="Cash"
                            value={formatAmount(overview.cashTotal)}
                            className={amountClassName}
                        />
                        <MiniMetric
                            label="Flow"
                            value={formatAmount(overview.netMonthlyCashflow)}
                            className={amountClassName}
                        />
                    </div>

                    {topAccounts.length > 0 && (
                        <div className="space-y-1">
                            {topAccounts.map((acc) => (
                                <div
                                    key={acc.id}
                                    className="flex justify-between text-xs"
                                >
                                    <span className="text-gray-500 dark:text-zinc-400 truncate">
                                        {acc.name}
                                    </span>
                                    <span
                                        className={`font-medium text-gray-700 dark:text-zinc-300 ml-2 ${amountClassName}`}
                                    >
                                        {formatAmount(
                                            acc.balance,
                                            acc.currency,
                                        )}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {accountCount === 0 && (
                        <p className="text-xs text-gray-400 dark:text-zinc-500 text-center py-2">
                            Add accounts in Finance
                        </p>
                    )}

                    {subscriptionTotal > 0 && (
                        <div className="flex justify-between text-xs pt-1 border-t border-gray-100 dark:border-zinc-800">
                            <span className="text-gray-400 dark:text-zinc-500">
                                Subscriptions
                            </span>
                            <span
                                className={`text-red-400 font-medium ${amountClassName}`}
                            >
                                {formatAmount(subscriptionTotal)}/mo
                            </span>
                        </div>
                    )}

                    {action && (
                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60 p-2">
                            <div className="flex justify-between gap-2">
                                <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                                    {action.label}
                                </span>
                                <span className="text-[10px] text-emerald-500">
                                    {Math.round(action.confidence * 100)}%
                                </span>
                            </div>
                            <p className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70 mt-0.5 line-clamp-2">
                                {action.reason}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </WidgetShell>
    );
}

function MiniMetric({
    label,
    value,
    className = '',
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/70 px-2 py-1.5">
            <p className="text-[9px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                {label}
            </p>
            <p
                className={`text-xs font-semibold text-gray-800 dark:text-zinc-200 ${className}`}
            >
                {value}
            </p>
        </div>
    );
}
