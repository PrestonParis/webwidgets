import { supabase } from '@/lib/db/supabase';
import { Tracker } from '@/features/recovery/types/recovery';
import { Dispatch, SetStateAction } from 'react';

export function useRecoveryActions(
    setTrackers: Dispatch<SetStateAction<Tracker[]>>,
) {
    const handleReset = async (id: string) => {
        const now = new Date().toISOString();
        setTrackers((prev) =>
            prev.map((t) => (t.id === id ? { ...t, start_time: now } : t)),
        );
        await supabase
            .from('relapses')
            .insert({ relapsed_at: now, tracker_id: id });
        await supabase
            .from('recovery_profiles')
            .update({ start_time: now })
            .eq('id', id);
    };

    const handleTrackerCardReset = (
        id: string,
        onReset: (id: string) => void,
    ) => {
        onReset(id);
    };

    const handleStreakReset = async (
        id: string,
        onReset: (id: string, now: string) => void,
        resetSeconds: () => void,
    ) => {
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
        setTrackers((prev) => prev.filter((t) => t.id !== id));
        await supabase.from('recovery_profiles').delete().eq('id', id);
    };

    const handleAddTracker = async (selectedAddiction: string) => {
        if (!selectedAddiction) return;
        const now = new Date().toISOString();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error('No user logged in');
        const insertResult = await supabase
            .from('recovery_profiles')
            .insert({
                start_time: now,
                addiction: selectedAddiction,
                user_id: user.id,
            })
            .select()
            .single();
        if (insertResult.error) throw insertResult.error;
        const newTracker = insertResult.data as unknown as Tracker;
        setTrackers((prev) => [...prev, newTracker]);
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
