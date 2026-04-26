import { supabase } from '@/app/lib/supabase';

export function useRecoveryActions(fetchTrackers: () => Promise<void>) {
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

    return { handleReset, handleDelete, handleAddTracker };
}
