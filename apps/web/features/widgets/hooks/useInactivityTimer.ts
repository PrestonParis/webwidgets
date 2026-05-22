'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Returns true when the user has been idle for `durationMs` milliseconds.
 * Resets on any mousemove, mousedown, keydown, or touchstart event.
 * No-ops (always returns false) when `enabled` is false.
 */
export function useInactivityTimer(
    durationMs: number,
    enabled: boolean,
): boolean {
    const [isIdle, setIsIdle] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        function reset() {
            setIsIdle(false);
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setIsIdle(true), durationMs);
        }

        const events = [
            'mousemove',
            'mousedown',
            'keydown',
            'touchstart',
            'scroll',
        ] as const;
        events.forEach((e) =>
            window.addEventListener(e, reset, { passive: true }),
        );
        reset();

        return () => {
            events.forEach((e) => window.removeEventListener(e, reset));
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [enabled, durationMs]);

    return enabled && isIdle;
}
