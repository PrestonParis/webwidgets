'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DiagramViewport } from '@/features/context/types/diagram';
import type {
    ContextGraph,
    ContextNode,
} from '@/features/context/types/context';

interface UseContextDiagramReturn {
    selectedId: string | null;
    selectedNode: ContextNode | null;
    graph: ContextGraph;
    viewport: DiagramViewport;
    isDragging: boolean;
    lockLayout: boolean;
    setLockLayout: (locked: boolean) => void;
    selectNode: (id: string | null) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    fitView: () => void;
    resetLayout: () => void;
    focusNode: (id: string | null) => void;
    onCanvasMouseDown: (e: React.MouseEvent) => void;
    onCanvasMouseMove: (e: React.MouseEvent) => void;
    onCanvasMouseUp: () => void;
    onCanvasWheel: (e: React.WheelEvent) => void;
    onNodePointerDown: (entityId: string, e: React.PointerEvent) => void;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 2.0;

export function useContextDiagram(
    graph: ContextGraph,
): UseContextDiagramReturn {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [viewport, setViewport] = useState<DiagramViewport>({
        scale: 0.85,
        offsetX: 0,
        offsetY: 0,
    });
    const [isDragging, setIsDragging] = useState(false);
    const [lockLayout, setLockLayout] = useState(false);
    const [manualPositions, setManualPositions] = useState<
        Record<string, { x: number; y: number }>
    >({});
    const dragStart = useRef<{
        x: number;
        y: number;
        ox: number;
        oy: number;
    } | null>(null);
    const nodeDrag = useRef<{
        id: string;
        x: number;
        y: number;
        nodeX: number;
        nodeY: number;
        moved: boolean;
    } | null>(null);

    const graphWithManualPositions = useMemo(
        () => ({
            ...graph,
            nodes: graph.nodes.map((node) => ({
                ...node,
                ...(manualPositions[node.entityId] ?? {}),
            })),
        }),
        [graph, manualPositions],
    );

    const selectedNode =
        graphWithManualPositions.nodes.find((n) => n.entityId === selectedId) ??
        null;

    const selectNode = useCallback((id: string | null) => {
        setSelectedId(id);
    }, []);

    const zoomIn = useCallback(() => {
        setViewport((v) => ({
            ...v,
            scale: Math.min(v.scale * 1.2, MAX_SCALE),
        }));
    }, []);

    const zoomOut = useCallback(() => {
        setViewport((v) => ({
            ...v,
            scale: Math.max(v.scale / 1.2, MIN_SCALE),
        }));
    }, []);

    const fitView = useCallback(() => {
        const nodes = graphWithManualPositions.nodes;
        if (nodes.length === 0) {
            setViewport({ scale: 0.85, offsetX: 0, offsetY: 0 });
            return;
        }
        const minX = Math.min(...nodes.map((node) => node.x));
        const maxX = Math.max(...nodes.map((node) => node.x));
        const minY = Math.min(...nodes.map((node) => node.y));
        const maxY = Math.max(...nodes.map((node) => node.y));
        const width = Math.max(maxX - minX + 220, 220);
        const height = Math.max(maxY - minY + 160, 160);
        const scale = Math.min(
            MAX_SCALE,
            Math.max(MIN_SCALE, Math.min(980 / width, 680 / height)),
        );
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        setViewport({
            scale,
            offsetX: 500 - centerX * scale,
            offsetY: 360 - centerY * scale,
        });
    }, [graphWithManualPositions]);

    const focusNode = useCallback(
        (id: string | null) => {
            const node = graphWithManualPositions.nodes.find(
                (item) => item.entityId === id,
            );
            if (!node) return;
            setSelectedId(node.entityId);
            setViewport((v) => ({
                ...v,
                offsetX: 500 - node.x * v.scale,
                offsetY: 360 - node.y * v.scale,
            }));
        },
        [graphWithManualPositions.nodes],
    );

    const resetLayout = useCallback(() => {
        setManualPositions({});
        window.setTimeout(() => fitView(), 0);
    }, [fitView]);

    const onCanvasMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (e.button !== 0) return;
            if (
                (e.target as HTMLElement).closest(
                    'button, a, input, select, textarea, [data-no-drag], [data-context-node]',
                )
            )
                return;
            setIsDragging(true);
            dragStart.current = {
                x: e.clientX,
                y: e.clientY,
                ox: viewport.offsetX,
                oy: viewport.offsetY,
            };
        },
        [viewport],
    );

    const onCanvasMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!isDragging || !dragStart.current) return;
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            setViewport((v) => ({
                ...v,
                offsetX: dragStart.current!.ox + dx,
                offsetY: dragStart.current!.oy + dy,
            }));
        },
        [isDragging],
    );

    const onCanvasMouseUp = useCallback(() => {
        setIsDragging(false);
        dragStart.current = null;
    }, []);

    const onNodePointerDown = useCallback(
        (entityId: string, e: React.PointerEvent) => {
            if (lockLayout || e.button !== 0) return;
            const node = graphWithManualPositions.nodes.find(
                (item) => item.entityId === entityId,
            );
            if (!node) return;
            e.preventDefault();
            e.stopPropagation();
            setSelectedId(entityId);
            nodeDrag.current = {
                id: entityId,
                x: e.clientX,
                y: e.clientY,
                nodeX: node.x,
                nodeY: node.y,
                moved: false,
            };
            setIsDragging(true);
        },
        [graphWithManualPositions.nodes, lockLayout],
    );

    const onCanvasWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const isZoom = e.ctrlKey || e.metaKey;
        if (isZoom) {
            const factor = e.deltaY > 0 ? 0.92 : 1.08;
            setViewport((v) => ({
                ...v,
                scale: Math.min(
                    Math.max(v.scale * factor, MIN_SCALE),
                    MAX_SCALE,
                ),
            }));
            return;
        }
        setViewport((v) => ({
            ...v,
            offsetX: v.offsetX - e.deltaX,
            offsetY: v.offsetY - e.deltaY,
        }));
    }, []);

    useEffect(() => {
        if (!isDragging) return;

        const onWindowMove = (e: MouseEvent | PointerEvent) => {
            if (nodeDrag.current) {
                const dx = (e.clientX - nodeDrag.current.x) / viewport.scale;
                const dy = (e.clientY - nodeDrag.current.y) / viewport.scale;
                if (Math.abs(dx) + Math.abs(dy) > 2) {
                    nodeDrag.current.moved = true;
                }
                const id = nodeDrag.current.id;
                setManualPositions((positions) => ({
                    ...positions,
                    [id]: {
                        x: nodeDrag.current!.nodeX + dx,
                        y: nodeDrag.current!.nodeY + dy,
                    },
                }));
                return;
            }
            if (!dragStart.current) return;
            const dx = e.clientX - dragStart.current.x;
            const dy = e.clientY - dragStart.current.y;
            setViewport((v) => ({
                ...v,
                offsetX: dragStart.current!.ox + dx,
                offsetY: dragStart.current!.oy + dy,
            }));
        };
        const onWindowUp = () => {
            setIsDragging(false);
            dragStart.current = null;
            nodeDrag.current = null;
        };

        window.addEventListener('mousemove', onWindowMove);
        window.addEventListener('mouseup', onWindowUp);
        window.addEventListener('pointermove', onWindowMove);
        window.addEventListener('pointerup', onWindowUp);
        window.addEventListener('blur', onWindowUp);
        return () => {
            window.removeEventListener('mousemove', onWindowMove);
            window.removeEventListener('mouseup', onWindowUp);
            window.removeEventListener('pointermove', onWindowMove);
            window.removeEventListener('pointerup', onWindowUp);
            window.removeEventListener('blur', onWindowUp);
        };
    }, [isDragging, viewport.scale]);

    return {
        selectedId,
        selectedNode,
        graph: graphWithManualPositions,
        viewport,
        isDragging,
        lockLayout,
        setLockLayout,
        selectNode,
        zoomIn,
        zoomOut,
        fitView,
        resetLayout,
        focusNode,
        onCanvasMouseDown,
        onCanvasMouseMove,
        onCanvasMouseUp,
        onCanvasWheel,
        onNodePointerDown,
    };
}
