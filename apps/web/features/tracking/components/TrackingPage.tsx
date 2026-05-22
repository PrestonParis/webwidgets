'use client';

import { useState } from 'react';
import { LoadingState } from '@/features/ui/loading';
import { useTrackingPage } from '@/features/tracking/hooks/useTrackingPage';
import { useTrackers } from '@/features/recovery/hooks/useTrackers';
import { useRecoveryActions } from '@/features/recovery/hooks/useRecoveryActions';
import { CategoryFilter } from './CategoryFilter';
import { DateRangeFilter } from './DateRangeFilter';
import { QuickEntryForm } from './QuickEntryForm';
import { TrackingStatsBar } from './TrackingStatsBar';
import { LogView } from './views/LogView';
import { InsightPanel } from './InsightPanel';
import { CorrelationPanel } from './CorrelationPanel';
import { ImportModal } from './ImportModal';
import { CustomCategoryManager } from './CustomCategoryManager';
import { GoalSettingsPanel } from './GoalSettingsPanel';
import { TrackingAutomationPanel } from './TrackingAutomationPanel';
import { TrackingPredictionPanel } from './TrackingPredictionPanel';
import TrackerGrid from '@/features/recovery/components/TrackerGrid';
import AddTrackerDrawer from '@/features/recovery/components/AddTrackerDrawer';
import ConfirmModal from '@/features/recovery/components/ConfirmModal';
import EmptyState from '@/features/recovery/components/EmptyState';
import type { PendingAction } from '@/features/recovery/types/recovery';

const LEFT_TABS = [
    { id: 'log', label: 'Log' },
    { id: 'recovery', label: 'Recovery' },
    { id: 'goals', label: 'Goals' },
    { id: 'import', label: 'Import' },
];

const RIGHT_TABS = [
    { id: 'insights', label: 'Insights' },
    { id: 'automation', label: 'Automation' },
    { id: 'predictions', label: 'Predictions' },
    { id: 'correlations', label: 'Correlations' },
];

export default function TrackingPage() {
    const {
        category,
        setCategory,
        activeTab,
        setActiveTab,
        showForm,
        setShowForm,
        showImport,
        setShowImport,
        showCustomManager,
        setShowCustomManager,
        editEntry,
        setEditEntry,
        range,
        setPreset,
        customCats,
        entries,
        allEntries,
        loading,
        refetch,
        handleAdd,
        handleUpdate,
        handleDelete,
    } = useTrackingPage();

    const [rightTab, setRightTab] = useState<'insights' | 'automation' | 'predictions' | 'correlations'>('insights');
    const [pending, setPending] = useState<PendingAction | null>(null);
    const [showAddTracker, setShowAddTracker] = useState(false);
    const { trackers, setTrackers, loading: recoveryLoading } = useTrackers();
    const {
        handleReset,
        handleDelete: handleDeleteTracker,
        handleAddTracker,
        handleUpdateStart,
    } = useRecoveryActions(setTrackers);

    const { customCategories, addCategory, deleteCategory } = customCats;

    const handleEditSubmit = async (
        updated: Parameters<typeof handleAdd>[0],
    ) => {
        if (!editEntry) return;
        await handleUpdate(editEntry.id, updated);
        setEditEntry(null);
        setShowForm(false);
    };

    const leftTab = (activeTab === 'insights' || activeTab === 'automation' || activeTab === 'predictions' || activeTab === 'correlations')
        ? 'log'
        : activeTab;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
            {/* Full-width top: header + stats */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">
                    Tracking
                </h1>
                <div className="flex gap-2">
                    <DateRangeFilter range={range} onPreset={setPreset} />
                    <button
                        onClick={() => {
                            setEditEntry(null);
                            setShowForm((v) => !v);
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 transition-colors"
                    >
                        {showForm && !editEntry ? 'Cancel' : '+ Log entry'}
                    </button>
                </div>
            </div>

            <TrackingStatsBar
                category={category}
                entries={entries}
                customDefs={customCategories}
            />

            {/* Two-column body */}
            <div className="grid gap-5 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
                {/* LEFT — what's being tracked */}
                <div className="min-w-0 space-y-4">
                    <CategoryFilter
                        active={category}
                        onChange={(c) => {
                            setCategory(c);
                            setShowForm(false);
                        }}
                        customCategories={customCategories}
                        onManageCustom={() => setShowCustomManager(true)}
                    />

                    {(showForm || editEntry !== null) && (
                        <div className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-sm">
                            {editEntry ? (
                                <>
                                    <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 mb-3">
                                        Editing entry
                                    </p>
                                    <QuickEntryForm
                                        initialCategory={editEntry.category}
                                        editEntry={editEntry}
                                        onSubmit={handleEditSubmit}
                                        onCancel={() => {
                                            setEditEntry(null);
                                            setShowForm(false);
                                        }}
                                        customCategories={customCategories}
                                    />
                                </>
                            ) : (
                                <QuickEntryForm
                                    initialCategory={category}
                                    onSubmit={async (entry) => {
                                        await handleAdd(entry);
                                        setShowForm(false);
                                    }}
                                    onCancel={() => setShowForm(false)}
                                    customCategories={customCategories}
                                />
                            )}
                        </div>
                    )}

                    {/* Left tabs */}
                    <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800">
                        {LEFT_TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => {
                                    setActiveTab(t.id as typeof activeTab);
                                    if (t.id === 'import') setShowImport(true);
                                }}
                                className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${leftTab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {leftTab === 'recovery' ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-gray-700 dark:text-zinc-300">
                                    Recovery Trackers
                                </p>
                                <button
                                    onClick={() => setShowAddTracker(true)}
                                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                                >
                                    + Add tracker
                                </button>
                            </div>
                            {recoveryLoading ? (
                                <LoadingState variant="section" minHeight="min-h-40" />
                            ) : trackers.length === 0 ? (
                                <EmptyState onAddClick={() => setShowAddTracker(true)} />
                            ) : (
                                <TrackerGrid
                                    trackers={trackers}
                                    onReset={(id) => setPending({ type: 'reset', id })}
                                    onUpdateStart={handleUpdateStart}
                                    onRequestDelete={(id) => setPending({ type: 'delete', id })}
                                />
                            )}
                        </div>
                    ) : loading ? (
                        <LoadingState variant="section" minHeight="min-h-40" />
                    ) : (
                        <>
                            {leftTab === 'goals' && (
                                <GoalSettingsPanel
                                    category={category}
                                    customDefs={customCategories}
                                />
                            )}
                            {leftTab === 'log' && (
                                <LogView
                                    entries={entries}
                                    category={category}
                                    onDelete={(id) => void handleDelete(id)}
                                    onEdit={(entry) => {
                                        setEditEntry(entry);
                                        setShowForm(true);
                                    }}
                                    customDefs={customCategories}
                                />
                            )}
                        </>
                    )}
                </div>

                {/* RIGHT — insights & automation */}
                <div className="space-y-4">
                    <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800 flex-wrap">
                        {RIGHT_TABS.map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setRightTab(t.id as typeof rightTab)}
                                className={`px-3 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${rightTab === t.id ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {rightTab === 'insights' && (
                        <InsightPanel entries={allEntries} />
                    )}
                    {rightTab === 'automation' && (
                        <TrackingAutomationPanel
                            entries={allEntries}
                            customDefs={customCategories}
                        />
                    )}
                    {rightTab === 'predictions' && (
                        <TrackingPredictionPanel
                            entries={allEntries}
                            customDefs={customCategories}
                        />
                    )}
                    {rightTab === 'correlations' && (
                        <CorrelationPanel entries={allEntries} />
                    )}
                </div>
            </div>

            {/* Modals */}
            <AddTrackerDrawer
                isOpen={showAddTracker}
                onClose={() => setShowAddTracker(false)}
                onAdd={handleAddTracker}
                existingTrackers={trackers}
            />

            {pending?.type === 'reset' && (
                <ConfirmModal
                    title="Reset streak?"
                    message="This will log a relapse and restart your streak from now."
                    confirmLabel="Reset"
                    destructive
                    onConfirm={() => {
                        void handleReset(pending.id);
                        setPending(null);
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
                        void handleDeleteTracker(pending.id);
                        setPending(null);
                    }}
                    onCancel={() => setPending(null)}
                />
            )}

            {showImport && (
                <ImportModal
                    onClose={() => {
                        setShowImport(false);
                        setActiveTab('log');
                    }}
                    onComplete={() => {
                        void refetch();
                        setShowImport(false);
                        setActiveTab('log');
                    }}
                />
            )}

            {showCustomManager && (
                <CustomCategoryManager
                    categories={customCategories}
                    onAdd={addCategory}
                    onDelete={deleteCategory}
                    onClose={() => setShowCustomManager(false)}
                />
            )}
        </div>
    );
}
