'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type {
    FinanceAccount,
    FinanceAccountType,
} from '@/features/finance/types/finance';

interface AddAccountModalProps {
    account?: FinanceAccount;
    onSave: (input: {
        name: string;
        type: FinanceAccountType;
        currency: string;
        balance: number;
        institution?: string | undefined;
    }) => Promise<void>;
    onClose: () => void;
}

export function AddAccountModal({
    account,
    onSave,
    onClose,
}: AddAccountModalProps) {
    const [name, setName] = useState(account?.name ?? '');
    const [type, setType] = useState<FinanceAccountType>(
        account?.type ?? 'checking',
    );
    const [currency, setCurrency] = useState(account?.currency ?? 'USD');
    const [institution, setInstitution] = useState(account?.institution ?? '');
    const [balance, setBalance] = useState(String(account?.balance ?? 0));
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const handleSubmit = async () => {
        const parsedBalance = Number(balance);
        if (!name.trim()) {
            setError('Name is required.');
            return;
        }
        if (!Number.isFinite(parsedBalance)) {
            setError('Balance must be numeric.');
            return;
        }
        setSaving(true);
        try {
            await onSave({
                name: name.trim(),
                type,
                currency,
                balance: parsedBalance,
                institution: institution.trim() || undefined,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200 dark:border-zinc-700 shadow-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 dark:text-zinc-200">
                        {account ? 'Edit account' : 'Add account'}
                    </p>
                    <button onClick={onClose}>
                        <X size={16} className="text-gray-400" />
                    </button>
                </div>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Name
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Chase Checking"
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) =>
                                setType(e.target.value as FinanceAccountType)
                            }
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        >
                            <option value="cash">Cash</option>
                            <option value="checking">Checking</option>
                            <option value="savings">Savings</option>
                            <option value="investment">Investment</option>
                            <option value="credit">Credit</option>
                            <option value="loan">Loan</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                            Institution
                        </label>
                        <input
                            value={institution}
                            onChange={(e) => setInstitution(e.target.value)}
                            placeholder="e.g. Chase"
                            className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                                Balance
                            </label>
                            <input
                                type="number"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                            />
                        </div>
                        <div className="w-20">
                            <label className="text-xs text-gray-500 dark:text-zinc-400 block mb-1">
                                Currency
                            </label>
                            <input
                                value={currency}
                                onChange={(e) =>
                                    setCurrency(e.target.value.toUpperCase())
                                }
                                maxLength={3}
                                className="w-full text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-gray-800 dark:text-zinc-200"
                            />
                        </div>
                    </div>
                </div>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button
                    onClick={() => void handleSubmit()}
                    disabled={saving || !name.trim()}
                    className="w-full text-xs py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-medium transition-colors"
                >
                    {saving
                        ? 'Saving...'
                        : account
                          ? 'Save account'
                          : 'Add account'}
                </button>
            </div>
        </div>
    );
}
