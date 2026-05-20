'use client';

import { buildFinanceAutomationRules } from '@/features/finance/lib/financeAutomations';
import { FINANCE_ACTIONS } from '@/features/finance/actions/financeActions';
import type {
    FinanceAccount,
    FinanceSubscription,
} from '@/features/finance/types/finance';

interface FinanceAutomationPanelProps {
    accounts: FinanceAccount[];
    subscriptions: FinanceSubscription[];
}

export function FinanceAutomationPanel({
    accounts,
    subscriptions,
}: FinanceAutomationPanelProps) {
    const rules = buildFinanceAutomationRules(accounts, subscriptions);

    return (
        <div className="rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Automation
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-zinc-400">
                        Rule stubs for reminders, alerts, and widget-triggered
                        finance actions.
                    </p>
                </div>
                <span className="text-[10px] rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 px-2 py-1">
                    {rules.filter((rule) => rule.enabled).length}/{rules.length}{' '}
                    ready
                </span>
            </div>
            <div className="grid gap-2 md:grid-cols-2">
                {rules.map((rule) => (
                    <div
                        key={rule.id}
                        className="rounded-xl bg-gray-50 dark:bg-zinc-800/60 p-3"
                    >
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                                {rule.label}
                            </p>
                            <span
                                className={`text-[10px] rounded-full px-2 py-0.5 ${rule.enabled ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300' : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300'}`}
                            >
                                {rule.enabled ? 'Enabled' : 'Waiting'}
                            </span>
                        </div>
                        <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">
                            {rule.type.replaceAll('_', ' ')}
                        </p>
                    </div>
                ))}
            </div>
            <div className="mt-4 border-t border-gray-100 dark:border-zinc-800 pt-3">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Widget actions
                    </p>
                    <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                        {FINANCE_ACTIONS.length} registered
                    </span>
                </div>
                <div className="flex flex-wrap gap-2">
                    {FINANCE_ACTIONS.map((action) => (
                        <span
                            key={action.id}
                            className="rounded-full bg-gray-50 dark:bg-zinc-800 px-2.5 py-1 text-[11px] text-gray-600 dark:text-zinc-300"
                        >
                            {action.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
