import { supabase } from '@/lib/db/supabase';
import { Tracker } from '@/types/recovery';
import { Dispatch, SetStateAction } from 'react';

export function useRecoveryActions(
    fetchTrackers: () => Promise<void>,
    setTrackers: Dispatch<SetStateAction<Tracker[]>>,
) {
    const handleReset = async (id: string) => {
        const confirmed = window.confirm('Reset this streak?');
        if (!confirmed) return;
        const now = new Date().toISOString();
        await supabase
            .from('relapses')
            .insert({ relapsed_at: now, tracker_id: id });
        await supabase
            .from('recovery_profiles')
            .update({ start_time: now })
            .eq('id', id);
        await fetchTrackers();
    };

    const handleTrackerCardReset = (
        id: string,
        setStartTime: (iso: string) => void,
        onReset: (id: string) => void,
    ) => {
        const now = new Date().toISOString();
        setStartTime(now);
        onReset(id);
    };

    const handleStreakReset = async (
        id: string,
        onReset: (id: string, now: string) => void,
        resetSeconds: () => void,
    ) => {
        const confirmed = window.confirm('Reset your streak?');
        if (!confirmed) return;
        const now = new Date().toISOString();
        await supabase
            .from('relapses')
            .insert({ relapsed_at: now, tracker_id: id });
        await supabase
            .from('recovery_profiles')
            .update({ start_time: now })
            .eq('id', id);
        onReset(id, now);
        resetSeconds();
    };

    const handleDelete = async (id: string) => {
        const confirmed = window.confirm('Delete this tracker permanently?');
        if (!confirmed) return;
        await supabase.from('recovery_profiles').delete().eq('id', id);
        await fetchTrackers();
    };

    const handleAddTracker = async (selectedAddiction: string) => {
        if (!selectedAddiction) return;
        const now = new Date().toISOString();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');
        const { error } = await supabase.from('recovery_profiles').insert({
            start_time: now,
            addiction: selectedAddiction,
            user_id: user.id,
        });
        if (error) throw error;
        await fetchTrackers();
    };

    const handleUpdateStart = (id: string, newStart: string) => {
        setTrackers((prev) =>
            prev.map((t) => (t.id === id ? { ...t, start_time: newStart } : t)),
        );
    };

    return {
        handleReset,
        handleTrackerCardReset,
        handleStreakReset,
        handleDelete,
        handleAddTracker,
        handleUpdateStart,
    };
}
