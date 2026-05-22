import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/lib/db/supabase';
import { clientLogger } from '@/lib/observability/clientLogger';
import { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { Tracker } from '@/features/recovery/types/recovery';
import { useLayoutPersistence } from './useLayoutPersistence';
import {
    buildDefaultLayout,
    reconcileLayout,
    makePersistKey,
    makeSealedKey,
    readCachedLayout,
    readCachedTimestamp,
    readSeenTrackerIds,
    saveSeenTrackerIds,
} from '../lib/dashboardLayout';
import { useFolderRegistry } from '@/features/search/store/useFolderRegistry';
import { useAuthContext } from '@/features/auth/context/AuthContext';

export function useDashboardLayout(trackers: Tracker[] | null) {
    const { user, status } = useAuthContext();
    const userId = user?.id ?? null;
    const safeTrackers = useMemo(() => trackers ?? [], [trackers]);
    const [layout, setLayout] = useState<WidgetConfig[]>([]);
    const [ready, setReady] = useState(false);
    const hasLoadedInitial = useRef(false);

    useEffect(() => {
        if (!userId || trackers === null || hasLoadedInitial.current) return;

        async function load() {
            let showedCached = false;
            const sealed = localStorage.getItem(makeSealedKey(userId!)) === '1';
            try {
                const cached = readCachedLayout(userId!);
                const cachedTs = readCachedTimestamp(userId!);

                if (cached) {
                    const seenIds = readSeenTrackerIds(userId!);
                    setLayout(reconcileLayout(cached, safeTrackers, sealed, seenIds));
                    setReady(true);
                    showedCached = true;
                }

                const { data } = await supabase
                    .from('dashboard_layouts')
                    .select('layout, updated_at')
                    .eq('user_id', userId!)
                    .maybeSingle();

                const remoteLayout = data?.layout as WidgetConfig[] | null;
                const remoteTs = data?.updated_at;

                const source = (() => {
                    if (!remoteLayout) return cached;
                    if (!cached || !cachedTs) return remoteLayout;
                    return cachedTs > (remoteTs ?? '') ? cached : remoteLayout;
                })();

                const seenTrackerIds = readSeenTrackerIds(userId!);
                const finalLayout = source
                    ? reconcileLayout(source, safeTrackers, sealed, seenTrackerIds)
                    : buildDefaultLayout(safeTrackers);

                // Mark all trackers as seen so future reconciles won't re-inject
                // ones the user has since removed. Only write if the set grew.
                const allTrackerIds = new Set([
                    ...seenTrackerIds,
                    ...safeTrackers.map((t) => t.id),
                ]);
                if (allTrackerIds.size > seenTrackerIds.size) {
                    saveSeenTrackerIds(userId!, allTrackerIds);
                }

                setLayout(finalLayout);
                localStorage.setItem(
                    makePersistKey(userId!),
                    JSON.stringify(finalLayout),
                );
                hasLoadedInitial.current = true;
            } catch (err) {
                clientLogger.error('Critical layout load error', { err });
                if (!showedCached) setLayout(buildDefaultLayout(safeTrackers));
            } finally {
                setReady(true);
            }
        }

        void load();
    }, [userId, trackers, safeTrackers]);

    const registerFolders = useFolderRegistry((s) => s.register);

    useEffect(() => {
        const folders = layout
            .filter((w) => w.type === 'folder' && w.props?.folderName)
            .map((w) => ({ id: w.id, name: w.props!.folderName! }));
        registerFolders(folders);
    }, [layout, registerFolders]);

    const persistLayout = useLayoutPersistence(userId ?? undefined);

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
