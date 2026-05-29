import { useState, useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
    WidgetConfig,
    SnapRule,
} from '@/features/dashboard/types/dashboard';
import { useWidgetSettingsContext } from '@/features/widgets/context/WidgetSettingsContext';
import { getWidgetMetadata } from '@/features/widgets/registry/widgetMetadata';
import {
    WIDGET_W,
    WIDGET_APPROX_H,
    ROW_STRIDE,
    SNAP_DIST,
} from '@/features/dashboard/lib/freeCanvasConfig';
import {
    autoPos,
    applyGridSnap,
    type Pos,
    type Size,
    type GuideLine,
} from '@/features/dashboard/lib/freeCanvasUtils';

interface UseFreeCanvasComputedOptions {
    layout: WidgetConfig[];
    snapRule: SnapRule;
}

interface UseFreeCanvasComputedResult {
    ctx: ReturnType<typeof useWidgetSettingsContext>;
    copyStyleMap: Map<
        string,
        {
            label: string;
            widgetType: string;
            settings: ReturnType<
                NonNullable<
                    ReturnType<typeof useWidgetSettingsContext>
                >['getSettings']
            >;
        }
    >;
    visible: WidgetConfig[];
    positions: Map<string, Pos>;
    setPositions: Dispatch<SetStateAction<Map<string, Pos>>>;
    sizes: Map<string, Size>;
    setSizes: Dispatch<SetStateAction<Map<string, Size>>>;
    computeSnap: (
        x: number,
        y: number,
        ownId: string,
        ownSize: Size,
    ) => { x: number; y: number; guides: GuideLine[] };
    canvasH: number;
}

export function useFreeCanvasComputed({
    layout,
    snapRule,
}: UseFreeCanvasComputedOptions): UseFreeCanvasComputedResult {
    const ctx = useWidgetSettingsContext();

    const copyStyleMap = useMemo(() => {
        const map = new Map<
            string,
            {
                label: string;
                widgetType: string;
                settings: ReturnType<NonNullable<typeof ctx>['getSettings']>;
            }
        >();
        if (!ctx) return map;
        for (const w of layout) {
            if (w.containerId !== 'main') continue;
            const label =
                w.type === 'folder'
                    ? `${w.props?.folderName ?? 'Folder'} Folder`
                    : getWidgetMetadata(w.type).label;
            map.set(w.id, {
                label,
                widgetType: w.type,
                settings: ctx.getSettings(w.id, w.type),
            });
        }
        return map;
    }, [layout, ctx]);

    const visible = useMemo(
        () =>
            layout
                .filter(
                    (w) =>
                        w.visible &&
                        w.containerId === 'main' &&
                        w.unpresented !== true,
                )
                .sort((a, b) => a.order - b.order),
        [layout],
    );

    const [positions, setPositions] = useState<Map<string, Pos>>(() => {
        const map = new Map<string, Pos>();
        visible.forEach((w, i) => {
            map.set(w.id, { x: w.x ?? autoPos(i).x, y: w.y ?? autoPos(i).y });
        });
        return map;
    });

    const [sizes, setSizes] = useState<Map<string, Size>>(() => {
        const map = new Map<string, Size>();
        visible.forEach((w) => {
            map.set(w.id, { w: w.w ?? WIDGET_W, h: w.h ?? WIDGET_APPROX_H });
        });
        return map;
    });

    const [prevVisibleLen, setPrevVisibleLen] = useState(visible.length);
    if (visible.length !== prevVisibleLen) {
        setPrevVisibleLen(visible.length);
        setPositions((prev) => {
            const next = new Map(prev);
            visible.forEach((w, i) => {
                if (!next.has(w.id))
                    next.set(w.id, {
                        x: w.x ?? autoPos(i).x,
                        y: w.y ?? autoPos(i).y,
                    });
            });
            for (const id of next.keys()) {
                if (!visible.find((w) => w.id === id)) next.delete(id);
            }
            return next;
        });
        setSizes((prev) => {
            const next = new Map(prev);
            visible.forEach((w) => {
                if (!next.has(w.id))
                    next.set(w.id, {
                        w: w.w ?? WIDGET_W,
                        h: w.h ?? WIDGET_APPROX_H,
                    });
            });
            for (const id of next.keys()) {
                if (!visible.find((w) => w.id === id)) next.delete(id);
            }
            return next;
        });
    }

    const computeSnap = useCallback(
        (
            x: number,
            y: number,
            ownId: string,
            ownSize: Size,
        ): { x: number; y: number; guides: GuideLine[] } => {
            const guides: GuideLine[] = [];
            let sx = x,
                sy = y;
            if (snapRule === 'grid') {
                sx = applyGridSnap(x);
                sy = applyGridSnap(y);
            } else if (snapRule === 'edges' || snapRule === 'guides') {
                const isGuides = snapRule === 'guides';
                for (const [id, pos] of positions.entries()) {
                    if (id === ownId) continue;
                    const otherSize = sizes.get(id) ?? {
                        w: WIDGET_W,
                        h: WIDGET_APPROX_H,
                    };
                    const re = pos.x + otherSize.w;
                    const be = pos.y + otherSize.h;
                    // left edge of target / right edge of target / right edge of own aligns to left of target
                    if (Math.abs(x - pos.x) < SNAP_DIST) {
                        sx = pos.x;
                        if (isGuides) guides.push({ axis: 'x', value: pos.x });
                    } else if (Math.abs(x - re) < SNAP_DIST) {
                        sx = re;
                        if (isGuides) guides.push({ axis: 'x', value: re });
                    } else if (Math.abs(x + ownSize.w - pos.x) < SNAP_DIST) {
                        sx = pos.x - ownSize.w;
                        if (isGuides) guides.push({ axis: 'x', value: pos.x });
                    } else if (Math.abs(x + ownSize.w - re) < SNAP_DIST) {
                        sx = re - ownSize.w;
                        if (isGuides) guides.push({ axis: 'x', value: re });
                    }
                    // top / bottom / bottom-of-own to top-of-target / bottom-of-own to bottom
                    if (Math.abs(y - pos.y) < SNAP_DIST) {
                        sy = pos.y;
                        if (isGuides) guides.push({ axis: 'y', value: pos.y });
                    } else if (Math.abs(y - be) < SNAP_DIST) {
                        sy = be;
                        if (isGuides) guides.push({ axis: 'y', value: be });
                    } else if (Math.abs(y + ownSize.h - pos.y) < SNAP_DIST) {
                        sy = pos.y - ownSize.h;
                        if (isGuides) guides.push({ axis: 'y', value: pos.y });
                    } else if (Math.abs(y + ownSize.h - be) < SNAP_DIST) {
                        sy = be - ownSize.h;
                        if (isGuides) guides.push({ axis: 'y', value: be });
                    }
                }
            }
            return { x: Math.max(0, sx), y: Math.max(0, sy), guides };
        },
        [snapRule, positions, sizes],
    );

    const canvasH = Math.max(
        1200,
        ...[...positions.values()].map((p) => p.y + ROW_STRIDE),
    );

    return {
        ctx,
        copyStyleMap,
        visible,
        positions,
        setPositions,
        sizes,
        setSizes,
        computeSnap,
        canvasH,
    };
}
