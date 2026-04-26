'use client';

import { useState } from 'react';
import { useTrackers } from '@/hooks/Recovery/useTrackers';
import { useRecoveryActions } from '@/hooks/Recovery/useRecoveryActions';
import TrackerCard from '@/components/Recovery/TrackerCard';
import AddTrackerDrawer from '@/components/Recovery/AddTrackerDrawer';
import LoadingState from '@/components/Recovery/LoadingState';
import EmptyState from '@/components/Recovery/EmptyState';

export default function RecoveryPage() {
    const { trackers, setTrackers, loading, fetchTrackers } = useTrackers();
    const [showAddForm, setShowAddForm] = useState(false);
    const { handleReset, handleDelete, handleAddTracker } =
        useRecoveryActions(fetchTrackers);

    const handleUpdateStart = (id: string, newStart: string) => {
        setTrackers((prev) =>
            prev.map((t) => (t.id === id ? { ...t, start_time: newStart } : t)),
        );
    };

    if (loading) return <LoadingState />;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-black p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold">Recovery</h1>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="text-sm bg-purple-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-purple-700"
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trackers.map((tracker) => (
                        <div key={tracker.id} className="relative">
                            <TrackerCard
                                tracker={tracker}
                                onReset={handleReset}
                                onUpdateStart={handleUpdateStart}
                            />
                            <button
                                onClick={() => handleDelete(tracker.id)}
                                className="absolute top-4 right-14 text-xs text-gray-300 hover:text-red-400 transition-colors"
                            >
                                delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
