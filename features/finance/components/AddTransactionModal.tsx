'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { suggestTransactionCategory } from '@/features/finance/lib/financePredictions';
import type {
    FinanceAccount,
    FinanceTransaction,
    FinanceTransactionType,
} from '@/features/finance/types/finance';

interface AddTransactionModalProps {
    accounts: FinanceAccount[];
    transaction?: FinanceTransaction;
    onSave: (
        input: Omit<
            FinanceTransaction,
            'id' | 'userId' | 'createdAt' | 'occurredOn'
        >,
    ) => Promise<void>;
    onClose: () => void;
}

export function AddTransactionModal({
    accounts,
    transaction,
    onSave,
    onClose,
}: AddTransactionModalProps) {
    const [title, setTitle] = useState(
        transaction?.title ?? transaction?.merchant ?? '',
    );
    const [accountId, setAccountId] = useState(
        transaction?.accountId ?? accounts[0]?.id ?? '',
    );
    const [amount, setAmount] = useState(String(transaction?.amount ?? ''));
    const [type, setType] = useState<FinanceTransactionType>(
        transaction?.type ?? 'expense',
    );
    const [category, setCategory] = useState(transaction?.category ?? '');
    const [date, setDate] = useState(
        transaction?.date ?? new Date().toISOString().slice(0, 10),
    );
    const [notes, setNotes] = useState(transaction?.notes ?? '');
    const [recurringCandidate, setRecurringCandidate] = useState(
        transaction?.recurringCandidate ?? false,
    );
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const categorySuggestion =
        title.trim().length >= 3 ? suggestTransactionCategory(title) : null;
    const showSuggestion =
        categorySuggestion &&
        categorySuggestion.confidence >= 0.5 &&
        categorySuggestion.label !== category;

    const handleSubmit = async () => {
        const parsedAmount = Number(amount);
        if (!title.trim()) {
            setError('Title is required.');
            return;
        }
        if (!Number.isFinite(parsedAmount)) {
            setError('Amount must be numeric.');
            return;
        }
        if (!date || Number.isNaN(new Date(date).getTime())) {
            setError('Date must be valid.');
            return;
        }
        setSaving(true);
        try {
            await onSave({
                accountId,
                title: title.trim(),
                merchant: title.trim(),
                amount:
                    type === 'expense'
                        ? -Math.abs(parsedAmount)
                        : Math.abs(parsedAmount),
                type,
                category: category.trim() || 'Uncategorized',
                date,
                notes: notes.trim() || undefined,
                recurringCandidate,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                        {transaction ? 'Edit transaction' : 'Add transaction'}
                    </p>
                    <button onClick={onClose}>
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Merchant / title
                        </label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Whole Foods"
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Account
                        </label>
                        <select
                            value={accountId}
                            onChange={(e) => setAccountId(e.target.value)}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        >
                            <option value="">No account</option>
                            {accounts.map((account) => (
                                <option key={account.id} value={account.id}>
                                    {account.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) =>
                                setType(
                                    e.target.value as FinanceTransactionType,
                                )
                            }
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        >
                            <option value="expense">Expense</option>
                            <option value="income">Income</option>
                            <option value="transfer">Transfer</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Amount
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Date
                        </label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Category
                        </label>
                        <input
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            placeholder="e.g. Food"
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                        {showSuggestion && (
                            <button
                                type="button"
                                onClick={() =>
                                    setCategory(categorySuggestion.label)
                                }
                                className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                                Suggested:{' '}
                                <span className="font-semibold">
                                    {categorySuggestion.label}
                                </span>
                                <span className="text-zinc-400">
                                    (
                                    {Math.round(
                                        categorySuggestion.confidence * 100,
                                    )}
                                    %)
                                </span>
                            </button>
                        )}
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    <label className="sm:col-span-2 flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400">
                        <input
                            type="checkbox"
                            checked={recurringCandidate}
                            onChange={(e) =>
                                setRecurringCandidate(e.target.checked)
                            }
                        />
                        Recurring candidate
                    </label>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                    onClick={() => void handleSubmit()}
                    disabled={saving || !title.trim()}
                    className="w-full text-xs py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium transition-colors"
                >
                    {saving
                        ? 'Saving...'
                        : transaction
                          ? 'Save transaction'
                          : 'Add transaction'}
                </button>
            </div>
        </div>
    );
}
