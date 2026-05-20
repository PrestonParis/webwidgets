import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import {
    WIDGET_W,
    WIDGET_APPROX_H,
    GRID,
} from '@/features/dashboard/components/freeCanvasConfig';
import {
    type Pos,
    type Size,
    autoPos,
    closestEdgeMidpoints,
    removeGlueGroupId,
    removeWeaveGroupId,
} from '@/features/dashboard/components/freeCanvasUtils';
import type { GlueConnector } from '@/features/dashboard/components/GlueConnectors';

interface RelationsOptions {
    layout: WidgetConfig[];
    onLayoutChange: (next: WidgetConfig[]) => void;
    visible: WidgetConfig[];
    positions: Map<string, Pos>;
    sizes: Map<string, Size>;
    setPositions: Dispatch<SetStateAction<Map<string, Pos>>>;
}

// ─── glue sub-hook ────────────────────────────────────────────────────────────

function useGlueRelations({
    layout,
    onLayoutChange,
}: Pick<RelationsOptions, 'layout' | 'onLayoutChange'>) {
    const [pendingGlueId, setPendingGlueId] = useState<string | null>(null);

    const handleGlueToggle = useCallback(
        (id: string) => {
            const c = layout.find((w) => w.id === id);
            if (c?.glueGroupId) {
                const group = layout.filter(
                    (w) => w.glueGroupId === c.glueGroupId,
                );
                onLayoutChange(
                    layout.map((w) => {
                        if (
                            w.id === id ||
                            (group.length <= 2 &&
                                w.glueGroupId === c.glueGroupId)
                        )
                            return removeGlueGroupId(w);
                        return w;
                    }),
                );
                return;
            }
            setPendingGlueId((prev) => (prev === id ? null : id));
        },
        [layout, onLayoutChange],
    );

    const handleGlueConnect = useCallback(
        (targetId: string) => {
            if (!pendingGlueId || pendingGlueId === targetId) {
                setPendingGlueId(null);
                return;
            }
            const src = layout.find((w) => w.id === pendingGlueId);
            const tgt = layout.find((w) => w.id === targetId);
            if (!src || !tgt) return;
            const groupId =
                src.glueGroupId ?? tgt.glueGroupId ?? `glue-${Date.now()}`;
            onLayoutChange(
                layout.map((w) => {
                    if (
                        w.id === pendingGlueId ||
                        w.id === targetId ||
                        (src.glueGroupId &&
                            w.glueGroupId === src.glueGroupId) ||
                        (tgt.glueGroupId && w.glueGroupId === tgt.glueGroupId)
                    )
                        return { ...w, glueGroupId: groupId };
                    return w;
                }),
            );
            setPendingGlueId(null);
        },
        [pendingGlueId, layout, onLayoutChange],
    );

    return {
        pendingGlueId,
        setPendingGlueId,
        handleGlueToggle,
        handleGlueConnect,
    };
}

// ─── weave sub-hook ───────────────────────────────────────────────────────────

function useWeaveRelations({
    layout,
    onLayoutChange,
    positions,
    setPositions,
}: Pick<
    RelationsOptions,
    'layout' | 'onLayoutChange' | 'positions' | 'setPositions'
>) {
    const [pendingWeaveId, setPendingWeaveId] = useState<string | null>(null);

    const handleWeaveToggle = useCallback(
        (id: string) => {
            const c = layout.find((w) => w.id === id);
            if (c?.weaveGroupId) {
                onLayoutChange(
                    layout.map((w) =>
                        w.weaveGroupId === c.weaveGroupId
                            ? removeWeaveGroupId(w)
                            : w,
                    ),
                );
                return;
            }
            setPendingWeaveId((prev) => (prev === id ? null : id));
        },
        [layout, onLayoutChange],
    );

    const handleWeaveConnect = useCallback(
        (targetId: string) => {
            if (!pendingWeaveId || pendingWeaveId === targetId) {
                setPendingWeaveId(null);
                return;
            }
            const src = layout.find((w) => w.id === pendingWeaveId);
            const tgt = layout.find((w) => w.id === targetId);
            if (!src || !tgt) return;
            const groupId =
                src.weaveGroupId ?? tgt.weaveGroupId ?? `weave-${Date.now()}`;
            const srcPos = positions.get(pendingWeaveId) ?? { x: 0, y: 0 };
            setPositions((prev) => {
                const next = new Map(prev);
                for (const w of layout) {
                    if (
                        w.id === targetId ||
                        w.weaveGroupId === tgt.weaveGroupId
                    )
                        next.set(w.id, srcPos);
                }
                return next;
            });
            onLayoutChange(
                layout.map((w) => {
                    if (
                        w.id === pendingWeaveId ||
                        w.id === targetId ||
                        (src.weaveGroupId &&
                            w.weaveGroupId === src.weaveGroupId) ||
                        (tgt.weaveGroupId &&
                            w.weaveGroupId === tgt.weaveGroupId)
                    )
                        return {
                            ...w,
                            weaveGroupId: groupId,
                            x: srcPos.x,
                            y: srcPos.y,
                        };
                    return w;
                }),
            );
            setPendingWeaveId(null);
        },
        [pendingWeaveId, layout, onLayoutChange, positions, setPositions],
    );

    const handleUnweave = useCallback(
        (groupId: string) => {
            const members = layout.filter((w) => w.weaveGroupId === groupId);
            const leaderPos = members[0]
                ? (positions.get(members[0].id) ?? { x: 0, y: 0 })
                : { x: 0, y: 0 };
            const scattered = new Map(
                members.map((w, i) => [
                    w.id,
                    { x: leaderPos.x + i * (WIDGET_W + GRID), y: leaderPos.y },
                ]),
            );
            setPositions((prev) => {
                const next = new Map(prev);
                for (const [id, pos] of scattered.entries()) next.set(id, pos);
                return next;
            });
            onLayoutChange(
                layout.map((w) => {
                    if (w.weaveGroupId !== groupId) return w;
                    const p = scattered.get(w.id) ?? {
                        x: w.x ?? 0,
                        y: w.y ?? 0,
                    };
                    const { weaveGroupId: _r, ...rest } = w;
                    return { ...rest, x: p.x, y: p.y } as WidgetConfig;
                }),
            );
        },
        [layout, onLayoutChange, positions, setPositions],
    );

    return {
        pendingWeaveId,
        setPendingWeaveId,
        handleWeaveToggle,
        handleWeaveConnect,
        handleUnweave,
    };
}

// ─── main hook ────────────────────────────────────────────────────────────────

export function useFreeCanvasRelations({
    layout,
    onLayoutChange,
    visible,
    positions,
    sizes,
    setPositions,
}: RelationsOptions) {
    const {
        pendingGlueId,
        setPendingGlueId,
        handleGlueToggle,
        handleGlueConnect,
    } = useGlueRelations({ layout, onLayoutChange });
    const {
        pendingWeaveId,
        setPendingWeaveId,
        handleWeaveToggle,
        handleWeaveConnect,
        handleUnweave,
    } = useWeaveRelations({ layout, onLayoutChange, positions, setPositions });

    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setPendingGlueId(null);
                setPendingWeaveId(null);
            }
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [setPendingGlueId, setPendingWeaveId]);

    const glueConnectors = useMemo((): GlueConnector[] => {
        const connectors: GlueConnector[] = [];
        const groups = new Map<string, WidgetConfig[]>();
        for (const w of visible) {
            if (w.glueGroupId) {
                if (!groups.has(w.glueGroupId)) groups.set(w.glueGroupId, []);
                groups.get(w.glueGroupId)!.push(w);
            }
        }
        for (const [, members] of groups) {
            for (let i = 0; i < members.length; i++)
                for (let j = i + 1; j < members.length; j++) {
                    const a = members[i]!,
                        b = members[j]!;
                    const pa = positions.get(a.id) ?? autoPos(0),
                        pb = positions.get(b.id) ?? autoPos(1);
                    const sa = sizes.get(a.id) ?? {
                            w: WIDGET_W,
                            h: WIDGET_APPROX_H,
                        },
                        sb = sizes.get(b.id) ?? {
                            w: WIDGET_W,
                            h: WIDGET_APPROX_H,
                        };
                    const { x1, y1, x2, y2 } = closestEdgeMidpoints(
                        pa,
                        sa,
                        pb,
                        sb,
                    );
                    connectors.push({ key: `${a.id}-${b.id}`, x1, y1, x2, y2 });
                }
        }
        return connectors;
    }, [visible, positions, sizes]);

    const { wovenGroups, unwovenVisible } = useMemo(() => {
        const groups = new Map<string, WidgetConfig[]>();
        const unwoven: WidgetConfig[] = [];
        for (const w of visible) {
            if (w.weaveGroupId) {
                if (!groups.has(w.weaveGroupId)) groups.set(w.weaveGroupId, []);
                groups.get(w.weaveGroupId)!.push(w);
            } else unwoven.push(w);
        }
        return { wovenGroups: groups, unwovenVisible: unwoven };
    }, [visible]);

    return {
        pendingGlueId,
        pendingWeaveId,
        glueConnectors,
        wovenGroups,
        unwovenVisible,
        handleGlueToggle,
        handleGlueConnect,
        handleWeaveToggle,
        handleWeaveConnect,
        handleUnweave,
    };
}
