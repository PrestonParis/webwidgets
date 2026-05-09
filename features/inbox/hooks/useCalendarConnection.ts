'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function useCalendarConnection() {
    const { user } = useAuth();
    // null = not yet checked (loading), boolean = known
    const [isCalendarConnected, setIsCalendarConnected] = useState<
        boolean | null
    >(null);

    useEffect(() => {
        if (!user?.id) return;

        let cancelled = false;
        supabase
            .from('user_tokens')
            .select('has_calendar')
            .eq('user_id', user.id)
            .maybeSingle()
            .then(({ data }) => {
                if (!cancelled)
                    setIsCalendarConnected(data?.has_calendar ?? false);
            });

        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    return {
        isCalendarConnected: isCalendarConnected ?? false,
        loading: isCalendarConnected === null,
    };
}
