'use client';

import { useEffect, useRef, useState } from 'react';
import { BODY_MAP_VIEW_KEY } from './LayerTogglePanel';

interface PanZoomState {
    scale: number;
    x: number;
    y: number;
}

interface PanZoomCanvasProps {
    children: React.ReactNode;
    showZoomControls: boolean;
}

export function PanZoomCanvas({
    children,
    showZoomControls,
}: PanZoomCanvasProps) {
    const [pz, setPz] = useState<PanZoomState>({ scale: 1, x: 0, y: 0 });
    const dragging = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
    const lastDist = useRef<number | null>(null);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            try {
                const raw = localStorage.getItem(BODY_MAP_VIEW_KEY);
                if (!raw) return;
                const parsed = JSON.parse(raw) as Partial<PanZoomState>;
                if (
                    typeof parsed.scale === 'number' &&
                    typeof parsed.x === 'number' &&
                    typeof parsed.y === 'number'
                ) {
                    setPz({
                        scale: Math.min(4.0, Math.max(0.6, parsed.scale)),
                        x: parsed.x,
                        y: parsed.y,
                    });
                }
            } catch {
                /* ignore */
            }
        }, 0);
        return () => window.clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem(BODY_MAP_VIEW_KEY, JSON.stringify(pz));
        } catch {
            /* ignore */
        }
    }, [pz]);

    function onWheel(e: React.WheelEvent<HTMLDivElement>) {
        e.preventDefault();
        const rect = e.currentTarget.getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;
        setPz((prev) => {
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const nextScale = Math.min(4.0, Math.max(0.6, prev.scale * delta));
            const scaleRatio = nextScale / prev.scale;
            return {
                scale: nextScale,
                x: cx - scaleRatio * (cx - prev.x),
                y: cy - scaleRatio * (cy - prev.y),
            };
        });
    }

    function onMouseDown(e: React.MouseEvent) {
        dragging.current = true;
        lastPos.current = { x: e.clientX, y: e.clientY };
    }
    function onMouseMove(e: React.MouseEvent) {
        if (!dragging.current) return;
        const dx = e.clientX - lastPos.current.x;
        const dy = e.clientY - lastPos.current.y;
        lastPos.current = { x: e.clientX, y: e.clientY };
        setPz((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    }
    function onMouseUp() {
        dragging.current = false;
    }

    function onTouchStart(e: React.TouchEvent) {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastDist.current = Math.hypot(dx, dy);
        } else if (e.touches.length === 1) {
            lastPos.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
        }
    }
    function onTouchMove(e: React.TouchEvent) {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.hypot(dx, dy);
            if (lastDist.current !== null) {
                const ratio = dist / lastDist.current;
                setPz((prev) => ({
                    ...prev,
                    scale: Math.min(4.0, Math.max(0.6, prev.scale * ratio)),
                }));
            }
            lastDist.current = dist;
        } else if (e.touches.length === 1) {
            const dx = e.touches[0].clientX - lastPos.current.x;
            const dy = e.touches[0].clientY - lastPos.current.y;
            lastPos.current = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
            };
            setPz((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        }
    }
    function onTouchEnd() {
        lastDist.current = null;
    }

    function zoom(factor: number) {
        setPz((prev) => ({
            ...prev,
            scale: Math.min(4.0, Math.max(0.6, prev.scale * factor)),
        }));
    }
    function reset() {
        setPz({ scale: 1, x: 0, y: 0 });
    }

    return (
        <div
            className="relative overflow-hidden touch-none select-none"
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div
                style={{
                    transform: `translate(${pz.x}px, ${pz.y}px) scale(${pz.scale})`,
                    transformOrigin: '0 0',
                    willChange: 'transform',
                }}
            >
                {children}
            </div>
            {showZoomControls && (
                <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                    <button
                        type="button"
                        onClick={() => zoom(1.25)}
                        aria-label="Zoom in"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm"
                    >
                        +
                    </button>
                    <button
                        type="button"
                        onClick={() => zoom(0.8)}
                        aria-label="Zoom out"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-xs text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm"
                    >
                        −
                    </button>
                    <button
                        type="button"
                        onClick={reset}
                        aria-label="Reset zoom"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-[9px] text-gray-600 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700 shadow-sm"
                    >
                        ↺
                    </button>
                </div>
            )}
        </div>
    );
}
