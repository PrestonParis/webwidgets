'use client';

// Mutation-only hook for countdown write operations.
// The read side (listing countdowns) is handled by the runtime adapter pipeline
// via useWidgetData → import-export/exports → countdownAdapter.
// This hook only handles writes (add, update, delete).

import { useCallback } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';

const QUERY_KEY = ['widget-adapter', 'countdowns', 'current_user'];

export function useCountdownMutations() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const invalidate = useCallback(() => {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEY });
    }, [queryClient]);

    const addCountdown = useCallback(
        async (name: string, target_date: string, emoji: string) => {
            if (!user?.id || !name.trim() || !target_date) return;
            const { error } = await supabase.from('countdowns').insert({
                user_id: user.id,
                name: name.trim(),
                target_date,
                emoji,
            });
            if (!error) invalidate();
        },
        [user, invalidate],
    );

    const updateCountdown = useCallback(
        async (
            id: string,
            name: string,
            target_date: string,
            emoji: string,
        ) => {
            if (!user?.id || !id || !name.trim() || !target_date) return;
            const { error } = await supabase
                .from('countdowns')
                .update({ name: name.trim(), target_date, emoji })
                .eq('id', id)
                .eq('user_id', user.id);
            if (!error) invalidate();
        },
        [user, invalidate],
    );

    const deleteCountdown = useCallback(
        async (id: string) => {
            await supabase.from('countdowns').delete().eq('id', id);
            invalidate();
        },
        [invalidate],
    );

    return { addCountdown, updateCountdown, deleteCountdown };
}
