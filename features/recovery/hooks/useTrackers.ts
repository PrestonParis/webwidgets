import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { Tracker } from '@/types/recovery';

export function useTrackers() {
    const [trackers, setTrackers] = useState<Tracker[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTrackers = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setTrackers([]);
            return;
        }

        const { data, error } = await supabase
            .from('recovery_profiles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (!error) {
            setTrackers(data || []);
        } else {
            setTrackers([]);
        }
    };

    useEffect(() => {
        let cancelled = false;

        const initialize = async () => {
            setLoading(true);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                if (!cancelled) {
                    setTrackers([]);
                    setLoading(false);
                }
                return;
            }

            const { data, error } = await supabase
                .from('recovery_profiles')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true });

            if (!cancelled) {
                if (!error) {
                    setTrackers(data || []);
                } else {
                    setTrackers([]);
                }
                setLoading(false);
            }
        };

        initialize();

        return () => {
            cancelled = true;
        };
    }, []);

    return { trackers, setTrackers, loading, fetchTrackers };
}
