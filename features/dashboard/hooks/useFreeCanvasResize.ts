import { useState, useRef, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import {
    WIDGET_W,
    WIDGET_APPROX_H,
    MIN_W,
    MAX_W,
    MIN_H,
} from '@/features/dashboard/components/freeCanvasConfig';
import { type Size } from '@/features/dashboard/components/freeCanvasUtils';

interface UseFreeCanvasResizeOptions {
    sizes: Map<string, Size>;
    setSizes: Dispatch<SetStateAction<Map<string, Size>>>;
    layout: WidgetConfig[];
    onLayoutChange: (next: WidgetConfig[]) => void;
}

export function useFreeCanvasResize({
    sizes,
    setSizes,
    layout,
    onLayoutChange,
}: UseFreeCanvasResizeOptions) {
    const [resizingId, setResizingId] = useState<string | null>(null);
    const resizeRef = useRef<{
        id: string;
        startX: number;
        startY: number;
        startW: number;
        startH: number;
        axis: 'x' | 'y' | 'both';
    } | null>(null);

    const handleResizeDown = useCallback(
        (
            id: string,
            e: React.PointerEvent<HTMLDivElement>,
            axis: 'x' | 'y' | 'both',
        ) => {
            e.stopPropagation();
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            const s = sizes.get(id) ?? { w: WIDGET_W, h: WIDGET_APPROX_H };
            resizeRef.current = {
                id,
                startX: e.clientX,
                startY: e.clientY,
                startW: s.w,
                startH: s.h,
                axis,
            };
            setResizingId(id);
        },
        [sizes],
    );

    const handleResizeMove = useCallback(
        (id: string, e: React.PointerEvent<HTMLDivElement>) => {
            if (!resizeRef.current || resizeRef.current.id !== id) return;
            const { startX, startY, startW, startH, axis } = resizeRef.current;
            const newW =
                axis !== 'y'
                    ? Math.max(
                          MIN_W,
                          Math.min(MAX_W, startW + e.clientX - startX),
                      )
                    : startW;
            const newH =
                axis !== 'x'
                    ? Math.max(MIN_H, startH + e.clientY - startY)
                    : startH;
            setSizes((prev) => new Map(prev).set(id, { w: newW, h: newH }));
        },
        [setSizes],
    );

    const handleResizeUp = useCallback(
        (id: string) => {
            if (!resizeRef.current || resizeRef.current.id !== id) return;
            resizeRef.current = null;
            setResizingId(null);
            const s = sizes.get(id);
            if (!s) return;
            onLayoutChange(
                layout.map((w) => (w.id === id ? { ...w, w: s.w, h: s.h } : w)),
            );
        },
        [sizes, layout, onLayoutChange],
    );

    return { resizingId, handleResizeDown, handleResizeMove, handleResizeUp };
}
