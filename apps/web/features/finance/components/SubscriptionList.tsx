'use client';

import { useState } from 'react';
import { Edit3, Plus, Trash2 } from 'lucide-react';
import { AddSubscriptionModal } from './AddSubscriptionModal';
import { ActionButtons } from './ActionButtons';
import { ConfirmDialog } from './ConfirmDialog';
import type { FinanceSubscription } from '@/features/finance/types/finance';

const CYCLE_LABEL: Record<string, string> = {
    monthly: '/mo',
    yearly: '/yr',
    annual: '/yr',
    weekly: '/wk',
    custom: '',
};

interface SubscriptionListProps {
    subscriptions: FinanceSubscription[];
    monthlyTotal: number;
    onAdd: (
        input: Omit<
            FinanceSubscription,
            'id' | 'userId' | 'createdAt' | 'cadence' | 'nextChargeOn'
        >,
    ) => Promise<void>;
    onUpdate: (
        id: string,
        input: Omit<
            FinanceSubscription,
            'id' | 'userId' | 'createdAt' | 'cadence' | 'nextChargeOn'
        >,
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

export function SubscriptionList({
    subscriptions,
    monthlyTotal,
    onAdd,
    onUpdate,
    onDelete,
    formatAmount,
    amountClassName = '',
    showSeeAll,
    onSeeAll,
    autoOpenAdd,
}: SubscriptionListProps) {
    const [showModal, setShowModal] = useState(autoOpenAdd ?? false);
    const [editing, setEditing] = useState<FinanceSubscription | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<FinanceSubscription | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const fmt =
        formatAmount ??
        ((n: number) =>
            n.toLocaleString('en-US', { style: 'currency', currency: 'USD' }));

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            await onDelete(deleteTarget.id);
            setDeleteTarget(null);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-zinc-500">
                            Subscriptions
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
                    <p
                        className={`text-sm font-semibold text-red-400 mt-0.5 ${amountClassName}`}
                    >
                        {fmt(monthlyTotal)}/mo total
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-colors"
                >
                    <Plus size={11} /> Add
                </button>
            </div>
            {subscriptions.length === 0 && (
                <div className="text-center py-8 rounded-xl border border-dashed border-gray-200 dark:border-zinc-800">
                    <p className="text-sm text-gray-400 dark:text-zinc-500">
                        No subscriptions tracked
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">
                        Track recurring costs and upcoming billing dates.
                    </p>
                </div>
            )}
            {subscriptions.map((sub) => (
                <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800 group"
                >
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-800 dark:text-zinc-200">
                                {sub.name}
                            </p>
                            {!sub.active && (
                                <span className="text-[10px] rounded-full bg-zinc-200 dark:bg-zinc-700 px-1.5 py-0.5 text-zinc-500">
                                    Paused
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-500">
                            {sub.category}
                            {sub.nextBillingDate
                                ? ` · Next: ${sub.nextBillingDate}`
                                : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className={`text-sm font-semibold text-gray-800 dark:text-zinc-200 ${amountClassName}`}
                        >
                            {fmt(sub.amount)}
                            <span className="text-xs text-gray-400">
                                {CYCLE_LABEL[sub.billingCycle]}
                            </span>
                        </span>
                        <ActionButtons
                            actions={[
                                {
                                    id: 'edit',
                                    label: 'Edit',
                                    icon: Edit3,
                                    onClick: () => setEditing(sub),
                                },
                                {
                                    id: 'delete',
                                    label: 'Delete',
                                    icon: Trash2,
                                    destructive: true,
                                    onClick: () => setDeleteTarget(sub),
                                },
                            ]}
                        />
                    </div>
                </div>
            ))}
            {showModal && (
                <AddSubscriptionModal
                    onSave={onAdd}
                    onClose={() => setShowModal(false)}
                />
            )}
            {editing && (
                <AddSubscriptionModal
                    subscription={editing}
                    onSave={(input) => onUpdate(editing.id, input)}
                    onClose={() => setEditing(null)}
                />
            )}
            <ConfirmDialog
                isOpen={!!deleteTarget}
                title="Delete subscription?"
                message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                cancelLabel="Cancel"
                isDangerous
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => setDeleteTarget(null)}
            />
        </div>
    );
}
