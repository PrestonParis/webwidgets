'use client';

import { useState } from 'react';
import { useTrackingEntries } from './useTrackingEntries';
import { useTrackingActions } from './useTrackingActions';
import { useCustomCategories } from './useCustomCategories';
import { useDateRange } from './useDateRange';
import type { TrackingEntry } from '@/features/tracking/types/tracking';

export type TrackingPageTab =
    | 'log'
    | 'recovery'
    | 'goals'
    | 'predictions'
    | 'automation'
    | 'insights'
    | 'correlations'
    | 'import';

export function useTrackingPage() {
    const [category, setCategory] = useState<string>('sleep');
    const [activeTab, setActiveTab] = useState<TrackingPageTab>('log');
    const [showForm, setShowForm] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [showCustomManager, setShowCustomManager] = useState(false);
    const [editEntry, setEditEntry] = useState<TrackingEntry | null>(null);

    const { range, setPreset } = useDateRange('30d');
    const customCats = useCustomCategories();

    const { entries, loading, refetch } = useTrackingEntries({
        category,
        ...(range.from !== null && { from: range.from }),
        ...(range.to !== null && { to: range.to }),
    });
    const {
        entries: allEntries,
        loading: allLoading,
        refetch: refetchAll,
    } = useTrackingEntries({
        ...(range.from !== null && { from: range.from }),
        ...(range.to !== null && { to: range.to }),
    });

    const refetchBoth = async () => {
        await Promise.all([refetch(), refetchAll()]);
    };

    const { handleAdd, handleUpdate, handleDelete } =
        useTrackingActions(refetchBoth);

    return {
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
        loading: loading || allLoading,
        refetch: refetchBoth,
        handleAdd,
        handleUpdate,
        handleDelete,
    };
}
