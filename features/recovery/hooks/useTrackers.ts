import { useEffect, useState } from 'react';
import { supabase } from '@/lib/db/supabase';
import { Tracker } from '@/features/recovery/types/recovery';

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
            setTrackers(
                (data ?? []).flatMap((t) =>
                    t.addiction !== null &&
                    t.start_time !== null &&
                    t.created_at !== null
                        ? [
                              {
                                  id: t.id,
                                  addiction: t.addiction,
                                  start_time: t.start_time,
                                  created_at: t.created_at,
                              },
                          ]
                        : [],
                ),
            );
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
                    setTrackers(
                        (data ?? []).flatMap((t) =>
                            t.addiction !== null &&
                            t.start_time !== null &&
                            t.created_at !== null
                                ? [
                                      {
                                          id: t.id,
                                          addiction: t.addiction,
                                          start_time: t.start_time,
                                          created_at: t.created_at,
                                      },
                                  ]
                                : [],
                        ),
                    );
                } else {
                    setTrackers([]);
                }
                setLoading(false);
            }
        };

        void initialize();

        return () => {
            cancelled = true;
        };
    }, []);

    return { trackers, setTrackers, loading, fetchTrackers };
}
