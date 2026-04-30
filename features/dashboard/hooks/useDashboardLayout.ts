import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/lib/db/supabase';
import { WidgetConfig } from '@/types/dashboard';
import { Tracker } from '@/types/recovery';
import { useDebounce } from '@/hooks/global/useDebounce';
import {
    buildDefaultLayout,
    reconcileLayout,
    makePersistKey,
    readCachedLayout,
} from '../lib/dashboardLayout';

export function useDashboardLayout(trackers: Tracker[] | null) {
    const safeTrackers = useMemo(() => trackers ?? [], [trackers]);
    const [userId, setUserId] = useState<string | undefined>();
    const [layout, setLayout] = useState<WidgetConfig[]>([]);
    const [ready, setReady] = useState(false);
    const hasLoadedInitial = useRef(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id));
    }, []);

    useEffect(() => {
        if (!userId || trackers === null || hasLoadedInitial.current) return;

        async function load() {
            try {
                const cached = readCachedLayout(userId!);

                const { data } = await supabase
                    .from('dashboard_layouts')
                    .select('layout')
                    .eq('user_id', userId)
                    .maybeSingle();

                const remoteLayout = data?.layout as WidgetConfig[] | null;
                const source = remoteLayout ?? cached;

                const finalLayout = source
                    ? reconcileLayout(source, safeTrackers)
                    : buildDefaultLayout(safeTrackers);

                setLayout(finalLayout);
                localStorage.setItem(
                    makePersistKey(userId!),
                    JSON.stringify(finalLayout),
                );
                hasLoadedInitial.current = true;
            } catch (err) {
                console.error('Critical layout load error:', err);
                setLayout(buildDefaultLayout(safeTrackers));
            } finally {
                setReady(true);
            }
        }

        load();
    }, [userId, trackers, safeTrackers]);

    const persistToDb = useDebounce(
        async (next: WidgetConfig[], uid: string) => {
            await supabase
                .from('dashboard_layouts')
                .upsert(
                    {
                        user_id: uid,
                        layout: next,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'user_id' },
                );
        },
        1200,
    );

    const persistLayout = useCallback(
        (next: WidgetConfig[]) => {
            if (!userId) return;
            localStorage.setItem(makePersistKey(userId), JSON.stringify(next));
            persistToDb(next, userId);
        },
        [userId, persistToDb],
    );

    const updateLayout = useCallback(
        (next: WidgetConfig[]) => {
            setLayout(next);
            persistLayout(next);
        },
        [persistLayout],
    );

    const toggleVisibility = useCallback(
        (id: string) => {
            setLayout((prev) => {
                const next = prev.map((w) =>
                    w.id === id ? { ...w, visible: !w.visible } : w,
                );
                persistLayout(next);
                return next;
            });
        },
        [persistLayout],
    );

    return { layout, updateLayout, toggleVisibility, ready };
}
