import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/lib/db/supabase';
import { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { Tracker } from '@/features/recovery/types/recovery';
import { useLayoutPersistence } from './useLayoutPersistence';
import {
    buildDefaultLayout,
    reconcileLayout,
    makePersistKey,
    readCachedLayout,
    readCachedTimestamp,
} from '../lib/dashboardLayout';

export function useDashboardLayout(trackers: Tracker[] | null) {
    const safeTrackers = useMemo(() => trackers ?? [], [trackers]);
    const [userId, setUserId] = useState<string | undefined>();
    const [layout, setLayout] = useState<WidgetConfig[]>([]);
    const [ready, setReady] = useState(false);
    const hasLoadedInitial = useRef(false);

    useEffect(() => {
        void supabase.auth
            .getUser()
            .then(({ data }) => setUserId(data.user?.id));
    }, []);

    useEffect(() => {
        if (!userId || trackers === null || hasLoadedInitial.current) return;

        async function load() {
            let showedCached = false;
            try {
                const cached = readCachedLayout(userId!);
                const cachedTs = readCachedTimestamp(userId!);

                if (cached) {
                    setLayout(reconcileLayout(cached, safeTrackers));
                    setReady(true);
                    showedCached = true;
                }

                const { data } = await supabase
                    .from('dashboard_layouts')
                    .select('layout, updated_at')
                    .eq('user_id', userId)
                    .maybeSingle();

                const remoteLayout = data?.layout as WidgetConfig[] | null;
                const remoteTs = data?.updated_at as string | undefined;

                const source = (() => {
                    if (!remoteLayout) return cached;
                    if (!cached || !cachedTs) return remoteLayout;
                    return cachedTs > (remoteTs ?? '') ? cached : remoteLayout;
                })();

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
                if (!showedCached) setLayout(buildDefaultLayout(safeTrackers));
            } finally {
                setReady(true);
            }
        }

        void load();
    }, [userId, trackers, safeTrackers]);

    const persistLayout = useLayoutPersistence(userId);

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
