import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { supabase } from '@/lib/db/supabase';
import { WidgetConfig } from '@/types/dashboard';
import { Tracker } from '@/types/recovery';
import { useDebounce } from '@/hooks/dashboard/global/useDebounce';
import { base } from '@/lib/constants/dashboard';

function hydrateTrackers(
    layout: WidgetConfig[],
    trackers: Tracker[],
): WidgetConfig[] {
    return layout.map((w) => {
        if (w.type !== 'recovery') return w;

        const trackerId = w.id.replace('widget-recovery-', '');
        const fresh = trackers.find((t) => t.id === trackerId);

        if (fresh) {
            return {
                ...w,
                props: { ...w.props, tracker: fresh },
            };
        }

        return {
            ...w,
            type: 'recovery-empty',
            props: {},
        };
    });
}

function buildDefaultLayout(trackers: Tracker[]): WidgetConfig[] {
    if (trackers.length === 0) {
        base.push({
            id: 'widget-recovery-none',
            type: 'recovery-empty',
            visible: true,
            columnSpan: 1,
            containerId: 'main',
            order: 4,
        });
        return base;
    }

    const recoveryWidgets: WidgetConfig[] = trackers.map((t, i) => ({
        id: `widget-recovery-${t.id}`,
        type: 'recovery',
        visible: true,
        columnSpan: 1,
        containerId: 'main',
        order: base.length + i,
        props: { tracker: t },
    }));

    return [...base, ...recoveryWidgets];
}

export function useDashboardLayout(trackers: Tracker[] | null) {
    const safeTrackers = useMemo(() => trackers ?? [], [trackers]);
    const [userId, setUserId] = useState<string | undefined>();
    const [layout, setLayout] = useState<WidgetConfig[]>([]);
    const [ready, setReady] = useState(false);
    const hasLoadedInitial = useRef(false);

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUserId(data.user?.id);
        });
    }, []);

    useEffect(() => {
        if (!userId || trackers === null || hasLoadedInitial.current) return;

        async function load() {
            try {
                const storageKey = `dashboard_layout_${userId}`;
                let finalLayout: WidgetConfig[];

                const cached = localStorage.getItem(storageKey);
                let savedLayout: WidgetConfig[] | null = null;

                if (cached) {
                    try {
                        savedLayout = JSON.parse(cached);
                    } catch (e) {
                        console.error('Cache parse error', e);
                    }
                }

                const { data } = await supabase
                    .from('dashboard_layouts')
                    .select('layout')
                    .eq('user_id', userId)
                    .maybeSingle();

                const remoteLayout = data?.layout as WidgetConfig[] | null;
                const layoutSource = remoteLayout || savedLayout;

                if (layoutSource) {
                    // 1. Initial hydration of saved state
                    let workingLayout = hydrateTrackers(
                        layoutSource,
                        safeTrackers,
                    );

                    // 2. RECONCILE: Inject missing system widgets (like Chess) from defaults
                    const defaults = buildDefaultLayout(safeTrackers);
                    const currentIds = new Set(workingLayout.map((w) => w.id));
                    const missingFromDefaults = defaults.filter(
                        (w) => !currentIds.has(w.id),
                    );

                    if (missingFromDefaults.length > 0) {
                        workingLayout = [
                            ...workingLayout,
                            ...missingFromDefaults,
                        ];
                    }

                    // 3. CLEANUP: Filter out 'recovery-empty' if actual trackers exist
                    if (safeTrackers.length > 0) {
                        workingLayout = workingLayout.filter(
                            (w) => w.type !== 'recovery-empty',
                        );
                    }

                    // 4. ADD NEW TRACKERS: Handle newly created trackers not in layout
                    const existingTrackerIds = new Set(
                        workingLayout
                            .filter((w) => w.type === 'recovery')
                            .map((w) => w.id.replace('widget-recovery-', '')),
                    );

                    const missingTrackers = safeTrackers.filter(
                        (t) => !existingTrackerIds.has(t.id),
                    );

                    if (missingTrackers.length > 0) {
                        const newTrackerWidgets = missingTrackers.map(
                            (t, i) => ({
                                id: `widget-recovery-${t.id}`,
                                type: 'recovery' as const,
                                visible: true,
                                columnSpan: 1,
                                containerId: 'main' as const,
                                order: workingLayout.length + i,
                                props: { tracker: t },
                            }),
                        );
                        workingLayout = [
                            ...workingLayout,
                            ...newTrackerWidgets,
                        ];
                    }

                    finalLayout = workingLayout;
                } else {
                    finalLayout = buildDefaultLayout(safeTrackers);
                }

                setLayout(finalLayout);
                localStorage.setItem(storageKey, JSON.stringify(finalLayout));
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
            await supabase.from('dashboard_layouts').upsert(
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
            const storageKey = `dashboard_layout_${userId}`;
            localStorage.setItem(storageKey, JSON.stringify(next));
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
