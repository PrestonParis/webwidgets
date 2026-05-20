'use client';

import { useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { AddTransactionModal } from './AddTransactionModal';
import type {
    FinanceAccount,
    FinanceTransaction,
} from '@/features/finance/types/finance';

interface TransactionListProps {
    accounts: FinanceAccount[];
    transactions: FinanceTransaction[];
    onAdd: (
        input: Omit<
            FinanceTransaction,
            'id' | 'userId' | 'createdAt' | 'occurredOn'
        >,
    ) => Promise<void>;
    onUpdate: (
        id: string,
        input: Omit<
            FinanceTransaction,
            'id' | 'userId' | 'createdAt' | 'occurredOn'
        >,
    ) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    formatAmount?: (
        value: number,
        currency?: string,
        maximumFractionDigits?: number,
    ) => string;
    amountClassName?: string;
    autoOpenAdd?: boolean;
}

export function TransactionList({
    accounts,
    transactions,
    onAdd,
    onUpdate,
    onDelete,
    formatAmount,
    amountClassName = '',
    autoOpenAdd,
}: TransactionListProps) {
    const [showModal, setShowModal] = useState(autoOpenAdd ?? false);
    const [editing, setEditing] = useState<FinanceTransaction | null>(null);
    const fmt =
        formatAmount ??
        ((n: number) =>
            n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }));

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                    Transactions
                </p>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
                >
                    <Plus size={11} /> Add
                </button>
            </div>

            {transactions.length === 0 ? (
                <div className="text-center py-10 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                    <p className="text-sm text-gray-400 dark:text-zinc-500">
                        No transactions yet
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">
                        Add income and expenses to unlock cashflow insights.
                    </p>
                </div>
            ) : (
                <div className="space-y-1">
                    {transactions.slice(0, 50).map((tx) => (
                        <div
                            key={tx.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 group"
                        >
                            <div>
                                <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                                    {tx.title}
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                                    {tx.date} · {tx.category}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className={`text-sm font-semibold ${amountClassName} ${tx.amount < 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}
                                >
                                    {tx.amount > 0 ? '+' : ''}
                                    {fmt(tx.amount)}
                                </span>
                                <button
                                    onClick={() => setEditing(tx)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-emerald-400 transition-all"
                                >
                                    <Edit3 size={12} />
                                </button>
                                <button
                                    onClick={() => void onDelete(tx.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <AddTransactionModal
                    accounts={accounts}
                    onSave={onAdd}
                    onClose={() => setShowModal(false)}
                />
            )}
            {editing && (
                <AddTransactionModal
                    accounts={accounts}
                    transaction={editing}
                    onSave={(input) => onUpdate(editing.id, input)}
                    onClose={() => setEditing(null)}
                />
            )}
        </div>
    );
}
