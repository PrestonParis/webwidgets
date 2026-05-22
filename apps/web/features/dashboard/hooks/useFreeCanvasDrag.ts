import { useState, useRef, useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { PROX_DIST, WIDGET_W, WIDGET_APPROX_H } from '@/features/dashboard/components/freeCanvasConfig';
import {
    type Pos,
    type Size,
    type GuideLine,
} from '@/features/dashboard/components/freeCanvasUtils';
import { useWidgetSettingsContext } from '@/features/widgets/context/WidgetSettingsContext';
import { useIdleDrift } from './useIdleDrift';

type ComputeSnap = (
    x: number,
    y: number,
    id: string,
    ownSize: Size,
) => { x: number; y: number; guides: GuideLine[] };

interface UseFreeCanvasDragOptions {
    positions: Map<string, Pos>;
    sizes: Map<string, Size>;
    setPositions: Dispatch<SetStateAction<Map<string, Pos>>>;
    visible: WidgetConfig[];
    layout: WidgetConfig[];
    onLayoutChange: (next: WidgetConfig[]) => void;
    onDragComplete?: () => void;
    computeSnap: ComputeSnap;
    ctx: ReturnType<typeof useWidgetSettingsContext>;
}

function buildPositionUpdate(
    id: string,
    x: number,
    y: number,
    ctx: ReturnType<typeof useWidgetSettingsContext>,
    visible: WidgetConfig[],
    groupOffsets: Map<string, Pos>,
) {
    return (prev: Map<string, Pos>): Map<string, Pos> => {
        const next = new Map(prev);
        const prevPos = prev.get(id);
        next.set(id, { x, y });
        if (prevPos) {
            const dx = x - prevPos.x,
                dy = y - prevPos.y;
            for (const c of visible) {
                const ws = ctx?.getSettings(c.id, c.type);
                if (ws?.pinMode === 'anchor' && ws?.anchorId === id) {
                    const fp = next.get(c.id) ?? { x: 0, y: 0 };
                    next.set(c.id, { x: fp.x + dx, y: fp.y + dy });
                }
            }
        }
        for (const [fid, offset] of groupOffsets.entries()) {
            next.set(fid, { x: x + offset.x, y: y + offset.y });
        }
        return next;
    };
}

export function useFreeCanvasDrag({
    positions,
    sizes,
    setPositions,
    visible,
    layout,
    onLayoutChange,
    onDragComplete,
    computeSnap,
    ctx,
}: UseFreeCanvasDragOptions) {
    const [draggingId, setDraggingId] = useState<string | null>(null);
    const [guideLines, setGuideLines] = useState<GuideLine[]>([]);
    const [proximityHintId, setProximityHintId] = useState<string | null>(null);

    const draggingRef = useRef<string | null>(null);
    const startRef = useRef<{ wx: number; wy: number; px: number; py: number }>(
        { wx: 0, wy: 0, px: 0, py: 0 },
    );
    const groupOffsetsRef = useRef<Map<string, Pos>>(new Map());
    const rafRef = useRef<number | null>(null);
    const pendingMoveRef = useRef<{ id: string; e: React.PointerEvent<HTMLDivElement> } | null>(null);

    const { stopDrift } = useIdleDrift(positions, setPositions);

    const handleDragDown = useCallback(
        (id: string, e: React.PointerEvent<HTMLDivElement>) => {
            stopDrift();
            const pos = positions.get(id) ?? { x: 0, y: 0 };
            startRef.current = {
                wx: pos.x,
                wy: pos.y,
                px: e.clientX,
                py: e.clientY,
            };
            draggingRef.current = id;
            setDraggingId(id);
            const w = layout.find((w) => w.id === id);
            const offsets = new Map<string, Pos>();
            if (w?.glueGroupId) {
                for (const c of visible) {
                    if (c.id === id || c.glueGroupId !== w.glueGroupId)
                        continue;
                    const mp = positions.get(c.id) ?? { x: 0, y: 0 };
                    offsets.set(c.id, { x: mp.x - pos.x, y: mp.y - pos.y });
                }
            }
            if (w?.weaveGroupId) {
                for (const c of visible) {
                    if (c.id === id || c.weaveGroupId !== w.weaveGroupId)
                        continue;
                    offsets.set(c.id, { x: 0, y: 0 });
                }
            }
            groupOffsetsRef.current = offsets;
        },
        [stopDrift, positions, layout, visible],
    );

    const flushMove = useCallback(() => {
        rafRef.current = null;
        const pending = pendingMoveRef.current;
        if (!pending) return;
        pendingMoveRef.current = null;
        const { id, e } = pending;
        if (draggingRef.current !== id) return;
        const rawX = startRef.current.wx + (e.clientX - startRef.current.px);
        const rawY = startRef.current.wy + (e.clientY - startRef.current.py);
        const ownSize = sizes.get(id) ?? { w: WIDGET_W, h: WIDGET_APPROX_H };
        const { x, y, guides } = computeSnap(rawX, rawY, id, ownSize);
        setPositions(
            buildPositionUpdate(id, x, y, ctx, visible, groupOffsetsRef.current),
        );
        setGuideLines(guides);
        let closestId: string | null = null,
            closestDist = PROX_DIST;
        for (const [oid, op] of positions.entries()) {
            if (oid === id) continue;
            const d = Math.hypot(x - op.x, y - op.y);
            if (d < closestDist) {
                closestDist = d;
                closestId = oid;
            }
        }
        setProximityHintId(closestId);
    }, [computeSnap, ctx, visible, positions, sizes, setPositions]);

    const handleDragMove = useCallback(
        (id: string, e: React.PointerEvent<HTMLDivElement>) => {
            if (draggingRef.current !== id) return;
            pendingMoveRef.current = { id, e };
            if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(flushMove);
            }
        },
        [flushMove],
    );

    const handleDragUp = useCallback(
        (id: string) => {
            if (draggingRef.current !== id) return;
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            pendingMoveRef.current = null;
            draggingRef.current = null;
            setDraggingId(null);
            setGuideLines([]);
            setProximityHintId(null);
            const pos = positions.get(id);
            if (!pos) return;
            const updates = new Map<string, Pos>([[id, pos]]);
            for (const [fid] of groupOffsetsRef.current.entries()) {
                const fp = positions.get(fid);
                if (fp) updates.set(fid, fp);
            }
            groupOffsetsRef.current = new Map();
            onDragComplete?.();
            onLayoutChange(
                layout.map((w) => {
                    const u = updates.get(w.id);
                    return u ? { ...w, x: u.x, y: u.y } : w;
                }),
            );
        },
        [positions, layout, onLayoutChange, onDragComplete],
    );

    return {
        draggingId,
        guideLines,
        proximityHintId,
        handleDragDown,
        handleDragMove,
        handleDragUp,
    };
}
