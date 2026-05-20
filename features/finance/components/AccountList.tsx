'use client';

import { useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { AddAccountModal } from './AddAccountModal';
import type {
    FinanceAccount,
    FinanceAccountType,
} from '@/features/finance/types/finance';

const TYPE_COLORS: Record<string, string> = {
    cash: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    checking:
        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    savings:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    investment:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    credit: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    loan: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    other: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-700/70 dark:text-zinc-200',
};

const TYPE_LABEL: Record<string, string> = {
    cash: 'Cash',
    checking: 'Checking',
    savings: 'Savings',
    investment: 'Investment',
    credit: 'Credit',
    loan: 'Loan',
    other: 'Other',
};

interface AccountListProps {
    accounts: FinanceAccount[];
    onAdd: (input: {
        name: string;
        type: FinanceAccountType;
        currency: string;
        balance: number;
        institution?: string | undefined;
    }) => Promise<void>;
    onUpdate: (
        id: string,
        input: {
            name: string;
            type: FinanceAccountType;
            currency: string;
            balance: number;
            institution?: string | undefined;
        },
    ) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    formatAmount?: (
        value: number,
        currency?: string,
        maximumFractionDigits?: number,
    ) => string;
    amountClassName?: string;
    showSeeAll?: boolean;
    onSeeAll?: () => void;
    autoOpenAdd?: boolean;
}

export function AccountList({
    accounts,
    onAdd,
    onUpdate,
    onDelete,
    formatAmount,
    amountClassName = '',
    showSeeAll,
    onSeeAll,
    autoOpenAdd,
}: AccountListProps) {
    const [showModal, setShowModal] = useState(autoOpenAdd ?? false);
    const [editing, setEditing] = useState<FinanceAccount | null>(null);
    const fmt =
        formatAmount ??
        ((n: number, c = 'USD') =>
            n.toLocaleString('en-US', {
                style: 'currency',
                currency: c,
                maximumFractionDigits: 0,
            }));

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                        Accounts
                    </p>
                    {showSeeAll && onSeeAll && (
                        <button
                            onClick={onSeeAll}
                            className="text-[10px] text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                            See all
                        </button>
                    )}
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
                >
                    <Plus size={11} /> Add
                </button>
            </div>
            {accounts.length === 0 && (
                <div className="text-center py-8 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                    <p className="text-sm text-gray-400 dark:text-zinc-500">
                        No accounts yet
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">
                        Add cash, debt, and investments to power the overview.
                    </p>
                </div>
            )}
            {accounts.map((acc) => (
                <div
                    key={acc.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 group"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[acc.type] ?? ''}`}
                        >
                            {TYPE_LABEL[acc.type] ?? acc.type}
                        </span>
                        <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200 truncate">
                                {acc.name}
                            </p>
                            {acc.institution && (
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500 truncate">
                                    {acc.institution}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-sm font-semibold ${amountClassName} ${acc.balance < 0 ? 'text-red-500' : 'text-gray-800 dark:text-zinc-200'}`}
                        >
                            {fmt(acc.balance, acc.currency)}
                        </span>
                        <button
                            onClick={() => setEditing(acc)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-emerald-400 transition-all"
                        >
                            <Edit3 size={12} />
                        </button>
                        <button
                            onClick={() => void onDelete(acc.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            ))}
            {showModal && (
                <AddAccountModal
                    onSave={onAdd}
                    onClose={() => setShowModal(false)}
                />
            )}
            {editing && (
                <AddAccountModal
                    account={editing}
                    onSave={(input) => onUpdate(editing.id, input)}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}
