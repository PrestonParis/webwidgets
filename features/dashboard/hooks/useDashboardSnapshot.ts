'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { screenSnapshotSchema } from '@/features/widgets/schemas/snapshotSchemas';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import type { ScreenSnapshot } from '@/features/widgets/types/snapshot';

type SnapshotState = {
    snapshot: ScreenSnapshot | null;
    loading: boolean;
    error: boolean;
    refresh: () => Promise<void>;
};

function snapshotWidgetKey(layout: WidgetConfig[]) {
    return layout
        .map(
            (widget) =>
                `${widget.id}:${widget.type}:${widget.visible}:${widget.containerId}:${widget.unpresented ?? false}`,
        )
        .join('|');
}

function snapshotWidgets(layout: WidgetConfig[]) {
    return layout.map((widget) => ({
        id: widget.id,
        type: widget.type,
        visible: widget.visible,
        containerId: widget.containerId,
        unpresented: widget.unpresented,
    }));
}

export function useDashboardSnapshot(
    layout: WidgetConfig[],
    enabled: boolean,
): SnapshotState {
    const [snapshot, setSnapshot] = useState<ScreenSnapshot | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const widgetKey = snapshotWidgetKey(layout);
    const widgets = useMemo(() => snapshotWidgets(layout), [widgetKey]);

    const refresh = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(false);
        try {
            const res = await fetch('/api/dashboard/snapshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ widgets }),
            });
            if (!res.ok) throw new Error(`Dashboard snapshot ${res.status}`);
            const parsed = screenSnapshotSchema.safeParse(await res.json());
            if (!parsed.success)
                throw new Error('Invalid dashboard snapshot payload');
            setSnapshot(parsed.data);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    }, [enabled, widgets]);

    useEffect(() => {
        void refresh();
    }, [refresh, widgetKey]);

    return { snapshot, loading, error, refresh };
}
