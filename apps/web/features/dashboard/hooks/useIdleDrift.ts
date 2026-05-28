'use client';

import { useRef, useCallback, useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { Pos } from '@/features/dashboard/components/freeCanvasUtils';
import {
    WIDGET_W,
    WIDGET_APPROX_H,
} from '@/features/dashboard/components/freeCanvasConfig';

const IDLE_MS = 60_000;
const DRIFT_FPS = 24;
const DRIFT_INTERVAL = 1000 / DRIFT_FPS;
const MIN_SPEED = 0.4;
const MAX_SPEED = 1.2;

function randVel(): number {
    const mag = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED);
    return Math.random() < 0.5 ? mag : -mag;
}

/** Adds idle-drift behaviour to a free-canvas position map.
 *  After IDLE_MS of no input, widgets float around slowly.
 *  Any user interaction stops drift and eases positions back. */
export function useIdleDrift(
    positions: Map<string, Pos>,
    setPositions: Dispatch<SetStateAction<Map<string, Pos>>>,
): { stopDrift: () => void } {
    const posRef = useRef(positions);

    const savedRef = useRef<Map<string, Pos>>(new Map());
    const driftRef = useRef<Map<string, Pos>>(new Map());
    const velRef = useRef<Map<string, { vx: number; vy: number }>>(new Map());
    const rafRef = useRef<number>(0);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const driftingRef = useRef(false);

    const stopDrift = useCallback(() => {
        if (!driftingRef.current) return;
        driftingRef.current = false;
        cancelAnimationFrame(rafRef.current);

        const target = savedRef.current;
        const cur = driftRef.current;

        const snap = () => {
            let done = true;
            for (const [id, tgt] of target.entries()) {
                const c = cur.get(id) ?? tgt;
                const nx = c.x + (tgt.x - c.x) * 0.2;
                const ny = c.y + (tgt.y - c.y) * 0.2;
                cur.set(id, { x: nx, y: ny });
                if (Math.abs(nx - tgt.x) > 1 || Math.abs(ny - tgt.y) > 1)
                    done = false;
            }
            setPositions(new Map(cur));
            if (done) setPositions(new Map(target));
            else rafRef.current = requestAnimationFrame(snap);
        };
        rafRef.current = requestAnimationFrame(snap);
    }, [setPositions]);

    const startDrift = useCallback(() => {
        if (driftingRef.current) return;
        driftingRef.current = true;

        const saved = new Map(posRef.current);
        savedRef.current = saved;

        const drift = new Map(saved);
        driftRef.current = drift;

        const vels = new Map<string, { vx: number; vy: number }>();
        for (const id of saved.keys())
            vels.set(id, { vx: randVel(), vy: randVel() });
        velRef.current = vels;

        const W = typeof window !== 'undefined' ? window.innerWidth : 1200;
        const H = typeof window !== 'undefined' ? window.innerHeight : 900;
        let last = 0;

        const animate = (t: number) => {
            if (!driftingRef.current) return;
            if (t - last >= DRIFT_INTERVAL) {
                last = t;
                for (const [id, v] of vels.entries()) {
                    const p = drift.get(id) ?? { x: 0, y: 0 };
                    let nx = p.x + v.vx;
                    let ny = p.y + v.vy;
                    if (nx < 0) {
                        nx = 0;
                        v.vx = Math.abs(v.vx);
                    }
                    if (nx > W - WIDGET_W) {
                        nx = W - WIDGET_W;
                        v.vx = -Math.abs(v.vx);
                    }
                    if (ny < 0) {
                        ny = 0;
                        v.vy = Math.abs(v.vy);
                    }
                    if (ny > H - WIDGET_APPROX_H) {
                        ny = H - WIDGET_APPROX_H;
                        v.vy = -Math.abs(v.vy);
                    }
                    drift.set(id, { x: nx, y: ny });
                }
                setPositions(new Map(drift));
            }
            rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
    }, [setPositions]);

    useEffect(() => {
        posRef.current = positions;
    }, [positions]);

    useEffect(() => {
        const onActivity = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (driftingRef.current) stopDrift();
            timerRef.current = setTimeout(startDrift, IDLE_MS);
        };

        const events = [
            'mousemove',
            'keydown',
            'pointerdown',
            'wheel',
            'touchstart',
        ] as const;
        for (const ev of events)
            window.addEventListener(ev, onActivity, { passive: true });
        onActivity(); // prime the timer on mount

        return () => {
            for (const ev of events) window.removeEventListener(ev, onActivity);
            if (timerRef.current) clearTimeout(timerRef.current);
            cancelAnimationFrame(rafRef.current);
        };
    }, [startDrift, stopDrift]);

    return { stopDrift };
}
