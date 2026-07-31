'use client';

import {
    calculateNetWorth,
    calculateFinanceOverview,
    calculateCashRunwayDays,
    calculateSavingsRate,
    calculateBurnBreakdown,
    calculateNetWorthChangeDelta,
    getLargestAssetAccount,
} from '@/features/finance/lib/financeAggregations';
import type {
    FinanceAccount,
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';

interface FinanceCommandCenterProps {
    accounts: FinanceAccount[];
    transactions: FinanceTransaction[];
    subscriptions: FinanceSubscription[];
    formatAmount: (v: number, currency?: string, fractions?: number) => string;
    amountClassName?: string;
}

function KpiCard({
    label,
    value,
    sub,
    subColor,
    color,
    amountClassName,
}: {
    label: string;
    value: string;
    sub?: string;
    subColor?: string;
    color: string;
    amountClassName?: string;
}) {
    return (
        <div className="rounded-xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                {label}
            </p>
            <p
                className={`text-xl font-bold tabular-nums ${color} ${amountClassName ?? ''}`}
            >
                {value}
            </p>
            {sub && (
                <p
                    className={`text-[11px] font-medium ${subColor ?? 'text-gray-400 dark:text-zinc-500'}`}
                >
                    {sub}
                </p>
            )}
        </div>
    );
}

export function FinanceCommandCenter({
    accounts,
    transactions,
    subscriptions,
    formatAmount,
    amountClassName,
}: FinanceCommandCenterProps) {
    const netWorth = calculateNetWorth(accounts);
    const overview = calculateFinanceOverview(
        accounts,
        transactions,
        subscriptions,
    );
    const runway = calculateCashRunwayDays(
        accounts,
        transactions,
        subscriptions,
    );
    const savingsRate = calculateSavingsRate(transactions);
    const burn = calculateBurnBreakdown(transactions, subscriptions);
    const delta7d = calculateNetWorthChangeDelta(transactions, 7);
    const delta30d = calculateNetWorthChangeDelta(transactions, 30);
    const largestAsset = getLargestAssetAccount(accounts);

    const hasData = accounts.length > 0;

    const netWorthSub = (() => {
        if (!hasData) return undefined;
        const sign = delta30d >= 0 ? '+' : '';
        const driver = largestAsset
            ? `Largest asset: ${largestAsset.account.name}`
            : undefined;
        return `${sign}${formatAmount(delta30d, 'USD', 0)} this month${driver ? ` · ${driver}` : ''}`;
    })();

    const runwayMonths = Math.round((runway / 30) * 10) / 10;
    const runwayColor =
        runway < 30
            ? 'text-red-400'
            : runway < 90
              ? 'text-amber-400'
              : 'text-emerald-400';

    const savingsColor =
        savingsRate >= 20
            ? 'text-emerald-400'
            : savingsRate >= 5
              ? 'text-amber-400'
              : 'text-red-400';

    const delta7dSign = delta7d >= 0 ? '+' : '';

    return (
        <div className="space-y-3">
            {/* Hero net worth */}
            <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 pt-5 pb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-1">
                        Net Worth
                    </p>
                    <p
                        className={`text-4xl font-bold tabular-nums ${amountClassName ?? ''} ${netWorth >= 0 ? 'text-gray-900 dark:text-zinc-100' : 'text-red-500'}`}
                    >
                        {formatAmount(netWorth)}
                    </p>
                    {netWorthSub && (
                        <p
                            className={`text-sm mt-1 font-medium ${delta30d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                        >
                            {netWorthSub}
                        </p>
                    )}
                </div>
                {hasData && (
                    <div className="flex flex-col gap-1.5 text-right text-xs">
                        <div className="text-gray-400 dark:text-zinc-500">
                            <span className="font-semibold text-gray-700 dark:text-zinc-200">
                                {formatAmount(overview.totalAssets, 'USD', 0)}
                            </span>{' '}
                            assets
                        </div>
                        <div className="text-gray-400 dark:text-zinc-500">
                            <span
                                className={`font-semibold ${overview.totalLiabilities > 0 ? 'text-red-400' : 'text-gray-700 dark:text-zinc-200'}`}
                            >
                                {formatAmount(
                                    overview.totalLiabilities,
                                    'USD',
                                    0,
                                )}
                            </span>{' '}
                            owed
                        </div>
                        {transactions.length > 0 && (
                            <div
                                className={`font-semibold ${delta7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                            >
                                {delta7dSign}
                                {formatAmount(delta7d, 'USD', 0)} 7d
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 4 KPI cards */}
            {hasData && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <KpiCard
                        label="Cash Available"
                        value={formatAmount(overview.cashTotal, 'USD', 0)}
                        sub="Checking + savings + cash"
                        color="text-cyan-500"
                        amountClassName={amountClassName}
                    />
                    <KpiCard
                        label="Monthly Burn"
                        value={formatAmount(burn.total, 'USD', 0)}
                        sub={`Fixed ${formatAmount(burn.fixed, 'USD', 0)} · Variable ${formatAmount(burn.variable, 'USD', 0)}`}
                        color="text-orange-400"
                        amountClassName={amountClassName}
                    />
                    <KpiCard
                        label="Runway"
                        value={
                            runway >= 999 ? 'Comfortable' : `${runwayMonths}mo`
                        }
                        sub={
                            runway < 999
                                ? `${runway} days of cash`
                                : 'No burn data yet'
                        }
                        subColor={runwayColor}
                        color={runwayColor}
                    />
                    <KpiCard
                        label="Savings Rate"
                        value={
                            transactions.length > 0 ? `${savingsRate}%` : '--'
                        }
                        sub={
                            savingsRate > 0
                                ? `Keeping ${savingsRate}% of income`
                                : 'Add income transactions'
                        }
                        subColor={savingsColor}
                        color={savingsColor}
                    />
                </div>
            )}

            {!hasData && (
                <p className="text-sm text-gray-400 dark:text-zinc-500 px-1">
                    Add accounts to see your financial position.
                </p>
            )}
        </div>
    );
}
