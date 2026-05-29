'use client';

import { useCallback, useState, useRef } from 'react';
import type { DiagramViewport } from '@/features/context/types/diagram';
import type {
    ContextGraph,
    ContextNode,
} from '@/features/context/types/context';

interface UseContextDiagramReturn {
    selectedId: string | null;
    selectedNode: ContextNode | null;
    viewport: DiagramViewport;
    isDragging: boolean;
    selectNode: (id: string | null) => void;
    zoomIn: () => void;
    zoomOut: () => void;
    fitView: () => void;
    onCanvasMouseDown: (e: React.MouseEvent) => void;
    onCanvasMouseMove: (e: React.MouseEvent) => void;
    onCanvasMouseUp: () => void;
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
    const dragStart = useRef<{
        x: number;
        y: number;
        ox: number;
        oy: number;
    } | null>(null);

    const selectedNode =
        graph.nodes.find((n) => n.entityId === selectedId) ?? null;

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
        setViewport({ scale: 0.85, offsetX: 0, offsetY: 0 });
    }, []);

    const onCanvasMouseDown = useCallback(
        (e: React.MouseEvent) => {
            if (e.button !== 0) return;
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

    return {
        selectedId,
        selectedNode,
        viewport,
        isDragging,
        selectNode,
        zoomIn,
        zoomOut,
        fitView,
        onCanvasMouseDown,
        onCanvasMouseMove,
        onCanvasMouseUp,
    };
}
