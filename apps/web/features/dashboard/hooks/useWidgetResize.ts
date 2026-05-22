import { useState, useRef } from 'react';
import type { WidgetSize } from '@/features/widgets/types/widgets';

const WIDE_THRESHOLD = 40;
const TALL_THRESHOLD = 50;

function computeSize(
    startSize: WidgetSize,
    dx: number,
    dy: number,
): WidgetSize {
    const wideStart = startSize === 'wide' || startSize === 'large';
    const tallStart = startSize === 'large';
    const wantWide = wideStart ? dx > -WIDE_THRESHOLD : dx > WIDE_THRESHOLD;
    const wantTall = tallStart ? dy > -TALL_THRESHOLD : dy > TALL_THRESHOLD;
    if (wantWide && wantTall) return 'large';
    if (wantWide && !wantTall) return 'wide';
    if (!wantWide && !wantTall)
        return startSize === 'compact' ? 'compact' : 'default';
    return 'default';
}

export interface UseWidgetResizeResult {
    isResizing: boolean;
    displaySize: WidgetSize;
    startResize: (
        e: React.PointerEvent<HTMLDivElement>,
        axis: 'x' | 'y' | 'both',
    ) => void;
    handleResizeMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    handleResizeUp: () => void;
}

export function useWidgetResize(
    committedSize: WidgetSize,
    setCommittedSize: (s: WidgetSize) => void,
    updateSettings: (s: { size: WidgetSize }) => void,
): UseWidgetResizeResult {
    const [resizePreview, setResizePreview] = useState<WidgetSize | null>(null);
    const resizeRef = useRef<{
        startX: number;
        startY: number;
        startSize: WidgetSize;
        axis: 'x' | 'y' | 'both';
    } | null>(null);

    const isResizing = resizePreview !== null;
    const displaySize = resizePreview ?? committedSize;

    function startResize(
        e: React.PointerEvent<HTMLDivElement>,
        axis: 'x' | 'y' | 'both',
    ) {
        e.stopPropagation();
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        resizeRef.current = {
            startX: e.clientX,
            startY: e.clientY,
            startSize: committedSize,
            axis,
        };
        setResizePreview(committedSize);
    }

    function handleResizeMove(e: React.PointerEvent<HTMLDivElement>) {
        if (!resizeRef.current) return;
        const dx =
            resizeRef.current.axis === 'y'
                ? 0
                : e.clientX - resizeRef.current.startX;
        const dy =
            resizeRef.current.axis === 'x'
                ? 0
                : e.clientY - resizeRef.current.startY;
        setResizePreview(computeSize(resizeRef.current.startSize, dx, dy));
    }

    function handleResizeUp() {
        const finalSize = resizePreview ?? committedSize;
        // Commit to local state first — guaranteed to be in same React batch
        // as clearing the preview, so displaySize stays correct with no flicker.
        setCommittedSize(finalSize);
        setResizePreview(null);
        resizeRef.current = null;
        if (finalSize !== committedSize) updateSettings({ size: finalSize });
    }

    return {
        isResizing,
        displaySize,
        startResize,
        handleResizeMove,
        handleResizeUp,
    };
}
