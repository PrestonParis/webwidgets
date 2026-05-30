'use client';

import { AlertTriangle, Check, Minus, X } from 'lucide-react';
import {
    filterToCurrentMonth,
    toMonthlySubscriptionAmount,
} from '@/features/finance/lib/financeAggregations';
import type {
    FinanceAccount,
    FinanceSubscription,
    FinanceTransaction,
} from '@/features/finance/types/finance';

interface ScoreFactor {
    label: string;
    detail: string;
    impact: number;
    status: 'good' | 'warn' | 'bad' | 'neutral';
}

interface Improvement {
    label: string;
    gain: number;
}

function computeHealthScore(
    accounts: FinanceAccount[],
    transactions: FinanceTransaction[],
    subscriptions: FinanceSubscription[],
): { score: number; factors: ScoreFactor[]; improvements: Improvement[] } {
    const thisMonth = filterToCurrentMonth(transactions);
    const income = thisMonth
        .filter((tx) => tx.type === 'income' || tx.amount > 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const expenses = thisMonth
        .filter((tx) => tx.type === 'expense' || tx.amount < 0)
        .reduce((s, tx) => s + Math.abs(tx.amount), 0);
    const cash = accounts
        .filter((a) => ['cash', 'checking', 'savings'].includes(a.type))
        .reduce((s, a) => s + a.balance, 0);
    const debt = accounts
        .filter((a) => ['credit', 'loan'].includes(a.type))
        .reduce((s, a) => s + Math.abs(a.balance), 0);
    const investments = accounts.filter((a) => a.type === 'investment');
    const subCost = subscriptions.reduce(
        (s, sub) => s + toMonthlySubscriptionAmount(sub),
        0,
    );
    const net = income - expenses - subCost;
    const emergencyTarget = Math.max(expenses, subCost) * 3;
    const hasIncome = income > 0;

    const factors: ScoreFactor[] = [];
    const improvements: Improvement[] = [];
    let score = 50;

    // Debt factor
    if (debt === 0) {
        factors.push({
            label: 'No debt',
            detail: 'No outstanding credit or loan balances',
            impact: 15,
            status: 'good',
        });
        score += 15;
    } else {
        const debtRatio = accounts
            .filter((a) => a.balance > 0)
            .reduce((s, a) => s + a.balance, 0);
        const ratio = debtRatio > 0 ? debt / debtRatio : 1;
        if (ratio < 0.3) {
            factors.push({
                label: 'Low debt',
                detail: `Debt is ${Math.round(ratio * 100)}% of assets`,
                impact: 5,
                status: 'good',
            });
            score += 5;
        } else {
            factors.push({
                label: 'High debt ratio',
                detail: `Debt is ${Math.round(ratio * 100)}% of assets`,
                impact: -10,
                status: 'bad',
            });
            score -= 10;
        }
    }

    // Investments
    if (investments.length > 0) {
        const invTotal = investments.reduce((s, a) => s + a.balance, 0);
        factors.push({
            label: 'Active investments',
            detail: `${investments.length} account${investments.length > 1 ? 's' : ''} totaling $${invTotal.toFixed(0)}`,
            impact: 10,
            status: 'good',
        });
        score += 10;
    } else {
        factors.push({
            label: 'No investment accounts',
            detail: 'No investment or brokerage accounts tracked',
            impact: 0,
            status: 'neutral',
        });
        improvements.push({ label: 'Add an investment account', gain: 10 });
    }

    // Cashflow
    if (!hasIncome) {
        factors.push({
            label: 'No income tracked',
            detail: 'Add income transactions to enable cashflow analysis',
            impact: 0,
            status: 'neutral',
        });
        improvements.push({ label: 'Track income transactions', gain: 10 });
    } else if (net >= 0) {
        factors.push({
            label: 'Positive cashflow',
            detail: `+$${net.toFixed(0)} net this month`,
            impact: 15,
            status: 'good',
        });
        score += 15;
    } else {
        factors.push({
            label: 'Negative cashflow',
            detail: `Spending exceeds income by $${Math.abs(net).toFixed(0)}/mo`,
            impact: -20,
            status: 'bad',
        });
        score -= 20;
        improvements.push({ label: 'Reduce recurring expenses', gain: 10 });
    }

    // Emergency fund
    if (emergencyTarget <= 0) {
        factors.push({
            label: 'No expense baseline',
            detail: 'Add transactions to compute emergency fund target',
            impact: 0,
            status: 'neutral',
        });
    } else if (cash >= emergencyTarget) {
        factors.push({
            label: 'Emergency fund covered',
            detail: `${(cash / Math.max(expenses + subCost, 1)).toFixed(1)}+ months of expenses saved`,
            impact: 20,
            status: 'good',
        });
        score += 20;
    } else if (cash >= emergencyTarget / 3) {
        const months = (cash / Math.max(expenses + subCost, 1)).toFixed(1);
        factors.push({
            label: 'Partial emergency fund',
            detail: `${months} months of runway (target: 3 months)`,
            impact: 5,
            status: 'warn',
        });
        score += 5;
        improvements.push({
            label: `Build emergency fund to $${emergencyTarget.toFixed(0)}`,
            gain: 15,
        });
    } else {
        const months = (cash / Math.max(expenses + subCost, 1)).toFixed(1);
        factors.push({
            label: 'Missing emergency fund',
            detail: `${months} months of runway (target is 3 months)`,
            impact: -10,
            status: 'bad',
        });
        score -= 10;
        improvements.push({
            label: 'Build a 3-month emergency fund',
            gain: 20,
        });
    }

    // Subscription burden
    if (hasIncome && subCost > 0) {
        const burden = subCost / income;
        if (burden > 0.3) {
            factors.push({
                label: 'High subscription burden',
                detail: `Subscriptions consume ${Math.round(burden * 100)}% of income`,
                impact: -5,
                status: 'warn',
            });
            score -= 5;
            improvements.push({
                label: 'Reduce monthly subscriptions',
                gain: 5,
            });
        } else if (burden > 0.15) {
            factors.push({
                label: 'Moderate subscription load',
                detail: `Subscriptions are ${Math.round(burden * 100)}% of income`,
                impact: 0,
                status: 'neutral',
            });
        } else {
            factors.push({
                label: 'Lean subscription load',
                detail: `Subscriptions are ${Math.round(burden * 100)}% of income`,
                impact: 5,
                status: 'good',
            });
            score += 5;
        }
    }

    return {
        score: Math.max(0, Math.min(100, score)),
        factors,
        improvements: improvements.slice(0, 3),
    };
}

interface FinancialHealthScoreProps {
    accounts: FinanceAccount[];
    transactions: FinanceTransaction[];
    subscriptions: FinanceSubscription[];
}

export function FinancialHealthScore({
    accounts,
    transactions,
    subscriptions,
}: FinancialHealthScoreProps) {
    const { score, factors, improvements } = computeHealthScore(
        accounts,
        transactions,
        subscriptions,
    );

    const scoreColor =
        score >= 70
            ? 'text-emerald-400'
            : score >= 45
              ? 'text-amber-400'
              : 'text-red-400';
    const scoreLabel =
        score >= 70 ? 'Good' : score >= 45 ? 'Fair' : 'Needs attention';
    const scoreBg =
        score >= 70
            ? 'bg-emerald-500'
            : score >= 45
              ? 'bg-amber-500'
              : 'bg-red-500';

    return (
        <div className="space-y-4">
            {/* Score header */}
            <div className="flex items-end gap-3">
                <div>
                    <span
                        className={`text-4xl font-bold tabular-nums ${scoreColor}`}
                    >
                        {score}
                    </span>
                    <span className="text-lg text-zinc-500 dark:text-zinc-500 font-normal">
                        {' '}
                        / 100
                    </span>
                </div>
                <div className="pb-1">
                    <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor} border ${score >= 70 ? 'border-emerald-500/30 bg-emerald-500/10' : score >= 45 ? 'border-amber-500/30 bg-amber-500/10' : 'border-red-500/30 bg-red-500/10'}`}
                    >
                        {scoreLabel}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all ${scoreBg}`}
                    style={{ width: `${score}%` }}
                />
            </div>

            {/* Factor breakdown */}
            <div className="space-y-2">
                {factors.map((factor) => (
                    <div
                        key={factor.label}
                        className="flex items-start gap-2.5 text-sm"
                    >
                        <span
                            className={`mt-0.5 shrink-0 ${factor.status === 'good' ? 'text-emerald-500' : factor.status === 'bad' ? 'text-red-400' : factor.status === 'warn' ? 'text-amber-400' : 'text-gray-400 dark:text-zinc-600'}`}
                        >
                            {factor.status === 'good' ? (
                                <Check size={14} strokeWidth={2.5} />
                            ) : factor.status === 'bad' ? (
                                <X size={14} strokeWidth={2.5} />
                            ) : factor.status === 'warn' ? (
                                <AlertTriangle size={14} strokeWidth={2.5} />
                            ) : (
                                <Minus size={14} />
                            )}
                        </span>
                        <div className="flex-1 min-w-0">
                            <span
                                className={`font-medium ${factor.status === 'good' ? 'text-gray-800 dark:text-zinc-200' : factor.status === 'bad' ? 'text-red-400' : factor.status === 'warn' ? 'text-amber-400' : 'text-gray-500 dark:text-zinc-400'}`}
                            >
                                {factor.label}
                            </span>
                            <span className="text-gray-400 dark:text-zinc-500 text-xs ml-1.5">
                                {factor.detail}
                            </span>
                        </div>
                        {factor.impact !== 0 && (
                            <span
                                className={`shrink-0 text-xs font-semibold tabular-nums ${factor.impact > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                            >
                                {factor.impact > 0 ? '+' : ''}
                                {factor.impact}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {/* Improvements */}
            {improvements.length > 0 && (
                <div className="pt-3 border-t border-gray-100 dark:border-zinc-800">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 dark:text-zinc-500 mb-2">
                        Top improvements
                    </p>
                    <div className="space-y-1.5">
                        {improvements.map((imp, i) => (
                            <div
                                key={imp.label}
                                className="flex items-center gap-2 text-xs"
                            >
                                <span className="text-gray-400 dark:text-zinc-500 tabular-nums">
                                    {i + 1}.
                                </span>
                                <span className="text-gray-600 dark:text-zinc-400 flex-1">
                                    {imp.label}
                                </span>
                                <span className="text-emerald-500 font-semibold">
                                    +{imp.gain} pts
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
