'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { screenSnapshotSchema } from '@/features/widgets/schemas/snapshotSchemas';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import type { ScreenSnapshot } from '@/features/widgets/types/snapshot';
import {
    DASHBOARD_BOOTSTRAP_WIDGET_COUNT,
    dashboardSnapshotWidgetKey,
    snapshotWidgets,
} from '@/features/dashboard/lib/dashboardSnapshotBootstrap';

type SnapshotState = {
    snapshot: ScreenSnapshot | null;
    loading: boolean;
    error: boolean;
    refresh: () => Promise<void>;
};

const SNAPSHOT_CACHE_TTL_MS = 10_000;
const snapshotCache = new Map<
    string,
    { snapshot: ScreenSnapshot; expiresAt: number }
>();
const inflightSnapshots = new Map<string, Promise<ScreenSnapshot>>();

export function useDashboardSnapshot(
    layout: WidgetConfig[],
    enabled: boolean,
): SnapshotState {
    const [snapshot, setSnapshot] = useState<ScreenSnapshot | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const widgetKey = dashboardSnapshotWidgetKey(layout);
    const widgets = useMemo(
        () => snapshotWidgets(layout, DASHBOARD_BOOTSTRAP_WIDGET_COUNT),
        [widgetKey, layout],
    );
    const requestKey = useMemo(
        () => JSON.stringify(widgets.map((w) => `${w.id}:${w.type}`)),
        [widgets],
    );

    const refresh = useCallback(async () => {
        if (!enabled) return;
        if (widgets.length === 0) {
            setSnapshot(null);
            setLoading(false);
            setError(false);
            return;
        }

        const cached = snapshotCache.get(requestKey);
        if (cached && cached.expiresAt > Date.now()) {
            setSnapshot(cached.snapshot);
            setLoading(false);
            setError(false);
            return;
        }

        setLoading(true);
        setError(false);
        try {
            const existing = inflightSnapshots.get(requestKey);
            const promise =
                existing ??
                fetch('/api/dashboard/snapshot', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ widgets }),
                })
                    .then(async (res) => {
                        if (!res.ok)
                            throw new Error(`Dashboard snapshot ${res.status}`);
                        const parsed = screenSnapshotSchema.safeParse(
                            await res.json(),
                        );
                        if (!parsed.success) {
                            throw new Error(
                                'Invalid dashboard snapshot payload',
                            );
                        }
                        return parsed.data;
                    })
                    .finally(() => inflightSnapshots.delete(requestKey));
            if (!existing) inflightSnapshots.set(requestKey, promise);
            const next = await promise;
            snapshotCache.set(requestKey, {
                snapshot: next,
                expiresAt: Date.now() + SNAPSHOT_CACHE_TTL_MS,
            });
            setSnapshot(next);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [enabled, requestKey, widgets]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { snapshot, loading, error, refresh };
}
