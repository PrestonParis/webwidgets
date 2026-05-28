'use client';

import { useCallback } from 'react';
import { useAuthContext } from '@/features/auth/context/AuthContext';
import {
    addEntry,
    updateEntry,
    deleteEntry,
} from '@/features/tracking/api/trackingApi';
import { migrateMoodLogs } from '@/features/tracking/api/moodMigrationApi';
import type { BaseTrackingEntry } from '@/features/tracking/types/trackingEntries';

const MOOD_MIGRATION_KEY = 'tracking_mood_migrated';

async function runMoodMigrationOnce(userId: string): Promise<void> {
    if (localStorage.getItem(MOOD_MIGRATION_KEY)) return;
    try {
        await migrateMoodLogs(userId);
        localStorage.setItem(MOOD_MIGRATION_KEY, '1');
    } catch (err) {
        console.error('[useTrackingActions] mood migration error', err);
    }
}

export function useTrackingActions(refetch: () => Promise<void>): {
    handleAdd: (entry: BaseTrackingEntry) => Promise<void>;
    handleUpdate: (
        id: string,
        updates: Partial<BaseTrackingEntry>,
    ) => Promise<void>;
    handleDelete: (id: string) => Promise<void>;
} {
    const { user } = useAuthContext();

    const handleAdd = useCallback(
        async (entry: BaseTrackingEntry) => {
            if (!user) return;
            await runMoodMigrationOnce(user.id);
            await addEntry(user.id, entry);
            await refetch();
        },
        [user, refetch],
    );

    const handleUpdate = useCallback(
        async (id: string, updates: Partial<BaseTrackingEntry>) => {
            if (!user) return;
            await updateEntry(user.id, id, updates);
            await refetch();
        },
        [user, refetch],
    );

    const handleDelete = useCallback(
        async (id: string) => {
            if (!user) return;
            await runMoodMigrationOnce(user.id);
            await deleteEntry(user.id, id);
            await refetch();
        },
        [user, refetch],
    );

    return { handleAdd, handleUpdate, handleDelete };
}
