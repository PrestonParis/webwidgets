'use client';

import { useState } from 'react';
import { ArrowLeft, Heart, Plus } from 'lucide-react';
import { useTrackers } from '@/features/recovery/hooks/useTrackers';
import { useRecoveryActions } from '@/features/recovery/hooks/useRecoveryActions';
import TrackerGrid from '@/features/recovery/components/TrackerGrid';
import ConfirmModal from '@/features/recovery/components/ConfirmModal';
import type { PendingAction } from '@/features/recovery/types/recovery';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';

interface RecoverySubScreenProps {
    onBack: () => void;
    layout: WidgetConfig[];
    onAddAllToLayout: (newWidgets: WidgetConfig[]) => void;
}

export default function RecoverySubScreen({
    onBack,
    layout,
    onAddAllToLayout,
}: RecoverySubScreenProps) {
    const { trackers, setTrackers, loading } = useTrackers();
    const { handleReset, handleDelete, handleUpdateStart } =
        useRecoveryActions(setTrackers);
    const [pending, setPending] = useState<PendingAction | null>(null);

    function addAllToLayout() {
        const existingTrackerIds = new Set(
            layout
                .filter((w) => w.type === 'recovery')
                .map((w) => w.id.replace('widget-recovery-', '')),
        );
        const maxOrder = layout.reduce((m, w) => Math.max(m, w.order), -1);
        const newWidgets: WidgetConfig[] = [];
        trackers.forEach((t, i) => {
            if (existingTrackerIds.has(t.id)) return;
            newWidgets.push({
                id: `widget-recovery-${t.id}`,
                type: 'recovery',
                visible: true,
                columnSpan: 1,
                containerId: 'main',
                order: maxOrder + 1 + i,
                props: { tracker: t },
            });
        });
        if (newWidgets.length > 0) {
            onAddAllToLayout(newWidgets);
        }
    }

    const confirmPending = async () => {
        if (!pending) return;
        if (pending.type === 'reset') await handleReset(pending.id);
        else await handleDelete(pending.id);
        setPending(null);
    };

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                    <div className="flex items-center gap-2">
                        <Heart size={20} className="text-purple-500" />
                        <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-100">
                            Recovery Trackers
                        </h2>
                        <span className="text-sm text-zinc-400">
                            {trackers.length} tracker
                            {trackers.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
                <button
                    onClick={addAllToLayout}
                    disabled={trackers.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500 text-white text-xs font-semibold hover:bg-purple-600 disabled:opacity-40 disabled:cursor-default transition-colors"
                >
                    <Plus size={12} />
                    Add all to dashboard
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : trackers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-zinc-400">
                    <Heart
                        size={48}
                        className="mb-3 opacity-30 text-purple-400"
                    />
                    <p className="text-sm">No recovery trackers yet</p>
                    <p className="text-xs mt-1 text-zinc-500">
                        Visit{' '}
                        <a
                            href="/recovery"
                            className="underline hover:text-purple-500 transition-colors"
                        >
                            /recovery
                        </a>{' '}
                        to create your first tracker
                    </p>
                </div>
            ) : (
                <TrackerGrid
                    trackers={trackers}
                    onReset={(id) => setPending({ type: 'reset', id })}
                    onUpdateStart={(id, newStart) => {
                        void handleUpdateStart(id, newStart);
                    }}
                    onRequestDelete={(id) => setPending({ type: 'delete', id })}
                />
            )}

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
                    message="This will permanently delete this tracker and all associated data."
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
