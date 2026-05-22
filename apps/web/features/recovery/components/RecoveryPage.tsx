'use client';

import { useState } from 'react';
import { useTrackers } from '@/features/recovery/hooks/useTrackers';
import { useRecoveryActions } from '@/features/recovery/hooks/useRecoveryActions';
import TrackerGrid from '@/features/recovery/components/TrackerGrid';
import AddTrackerDrawer from '@/features/recovery/components/AddTrackerDrawer';
import ConfirmModal from '@/features/recovery/components/ConfirmModal';
import LoadingState from '@/features/ui/components/LoadingState';
import EmptyState from '@/features/recovery/components/EmptyState';
import { PendingAction } from '../types/recovery';
import { FACTS, RESOURCES } from '../constants';

function RecoverySidebar() {
    return (
        <div className="w-72 shrink-0 hidden lg:flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 space-y-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                    Get Help
                </h2>
                <div className="space-y-3">
                    {RESOURCES.map((r) => (
                        <a
                            key={r.label}
                            href={r.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block group"
                        >
                            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:underline">
                                {r.label}
                            </p>
                            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                                {r.detail}
                            </p>
                        </a>
                    ))}
                </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 space-y-3">
                <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-100">
                    Good to know
                </h2>
                <ul className="space-y-2">
                    {FACTS.map((f, i) => (
                        <li
                            key={i}
                            className="flex gap-2 text-[11px] text-gray-500 dark:text-zinc-400"
                        >
                            <span className="text-purple-400 shrink-0">›</span>
                            {f}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

export default function RecoveryPage() {
    const { trackers, setTrackers, loading } = useTrackers();
    const [showAddForm, setShowAddForm] = useState(false);
    const [pending, setPending] = useState<PendingAction | null>(null);
    const { handleReset, handleDelete, handleAddTracker, handleUpdateStart } =
        useRecoveryActions(setTrackers);

    const requestAction = (type: PendingAction['type'], id: string) =>
        setPending({ type, id });

    const confirmPending = async () => {
        if (!pending) return;
        if (pending.type === 'reset') await handleReset(pending.id);
        else await handleDelete(pending.id);
        setPending(null);
    };

    if (loading) return <LoadingState />;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-gray-900 dark:text-zinc-100">
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold">Recovery</h1>
                        <p className="text-sm text-gray-400 dark:text-zinc-500 mt-0.5">
                            Track your streaks, review your days, earn
                            milestones.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="text-sm bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700 transition-colors"
                    >
                        + Add tracker
                    </button>
                </div>

                <AddTrackerDrawer
                    isOpen={showAddForm}
                    onClose={() => setShowAddForm(false)}
                    onAdd={handleAddTracker}
                    existingTrackers={trackers}
                />

                {trackers.length === 0 ? (
                    <EmptyState onAddClick={() => setShowAddForm(true)} />
                ) : (
                    <div className="flex gap-6 items-start">
                        <div className="flex-1 min-w-0">
                            <TrackerGrid
                                trackers={trackers}
                                onReset={(id) => requestAction('reset', id)}
                                onUpdateStart={handleUpdateStart}
                                onRequestDelete={(id) =>
                                    requestAction('delete', id)
                                }
                            />
                        </div>
                        <RecoverySidebar />
                    </div>
                )}
            </div>

            {pending?.type === 'reset' && (
                <ConfirmModal
                    title="Reset streak?"
                    message="This will log a relapse and restart your streak from now. This action cannot be undone."
                    confirmLabel="Reset"
                    destructive
                    onConfirm={() => {
                        void confirmPending();
                    }}
                    onCancel={() => setPending(null)}
                />
            )}
            {pending?.type === 'delete' && (
                <ConfirmModal
                    title="Delete tracker?"
                    message="This will permanently remove the tracker and all its history."
                    confirmLabel="Delete"
                    destructive
                    onConfirm={() => {
                        void confirmPending();
                    }}
                    onCancel={() => setPending(null)}
                />
            )}
        </div>
    );
}
