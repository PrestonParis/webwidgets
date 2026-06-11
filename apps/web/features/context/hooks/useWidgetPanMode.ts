'use client';

import { useEffect, useRef, useState } from 'react';
import type { DiagramMode } from '@/features/context/types/context';

// How long after the last pan gesture before pan mode auto-exits.
const PAN_EXIT_MS = 7_000;

export interface UseWidgetPanModeReturn {
    widgetMode: DiagramMode;
    toggleMode: (next: DiagramMode) => void;
    onPanGestureStart: () => void;
    onPanGestureEnd: () => void;
}

/**
 * Manages the widget's interaction mode (view / pan / edit) and handles the
 * auto-exit timer for pan mode.
 *
 * When the user releases a pan drag, a 7-second timer starts. If no new pan
 * drag begins before the timer fires, the widget returns to view mode and
 * the widget becomes draggable on the canvas again.
 *
 * Placed in /hooks/ so it is exempt from the per-.tsx hook-count limit.
 */
export function useWidgetPanMode(): UseWidgetPanModeReturn {
    const [widgetMode, setWidgetMode] = useState<DiagramMode>('view');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function clearTimer() {
        if (timerRef.current !== null) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }

    function scheduleExit() {
        clearTimer();
        timerRef.current = setTimeout(() => {
            setWidgetMode('view');
        }, PAN_EXIT_MS);
    }

    function toggleMode(next: DiagramMode) {
        clearTimer();
        setWidgetMode((prev) => (prev === next ? 'view' : next));
    }

    // User pressed down to start a pan — cancel any pending exit.
    function onPanGestureStart() {
        clearTimer();
    }

    // User released from a pan — start the exit countdown.
    function onPanGestureEnd() {
        scheduleExit();
    }

    // Clear the timer on unmount to avoid state updates on a dead component.
    useEffect(() => clearTimer, []);

    return { widgetMode, toggleMode, onPanGestureStart, onPanGestureEnd };
}
