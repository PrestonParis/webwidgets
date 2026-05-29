import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/db/supabase';
import { useAuthContext } from '@/features/auth/components/AuthContext';
import { Tracker } from '@/features/recovery/types/recovery';
import { Dispatch, SetStateAction } from 'react';

export function useRecoveryActions(
    setTrackers: Dispatch<SetStateAction<Tracker[]>>,
) {
    const { user } = useAuthContext();
    const queryClient = useQueryClient();

    const invalidate = () =>
        void queryClient.invalidateQueries({
            queryKey: ['widget-adapter', 'recovery_records', 'current_user'],
        });
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
        invalidate();
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
        invalidate();
    };

    const handleDelete = async (id: string) => {
        setTrackers((prev) => prev.filter((t) => t.id !== id));
        await supabase.from('recovery_profiles').delete().eq('id', id);
        invalidate();
    };

    const handleAddTracker = async (selectedAddiction: string) => {
        if (!selectedAddiction) return;
        const now = new Date().toISOString();
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
        invalidate();
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
