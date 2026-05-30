'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Archive, ArchiveRestore, GripVertical, X } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { getDashboardWidgetLibrary } from '@/features/platform/lib/dashboardWidgetLibrary';

const STORAGE_KEY = 'webwidgets.bucket.position';
const HANDLE_W = 32;
const DRAG_THRESHOLD = 5; // px before a click becomes a drag

function loadPos(): { x: number; y: number } | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as { x: number; y: number }) : null;
    } catch {
        return null;
    }
}

function defaultPos() {
    if (typeof window === 'undefined') return { x: 0, y: 200 };
    return {
        x: window.innerWidth - HANDLE_W - 8,
        y: window.innerHeight / 2 - 60,
    };
}

interface FloatingBucketProps {
    layout: WidgetConfig[];
    onRestore: (id: string) => void;
    onRemove: (id: string) => void;
}

export function FloatingBucket({
    layout,
    onRestore,
    onRemove,
}: FloatingBucketProps) {
    const [pos, setPos] = useState<{ x: number; y: number }>(defaultPos);
    const [open, setOpen] = useState(false);
    const [dragging, setDragging] = useState(false);
    const handleRef = useRef<HTMLDivElement>(null);
    const offset = useRef({ dx: 0, dy: 0 });
    const startClient = useRef({ x: 0, y: 0 });
    const didDrag = useRef(false);

    useEffect(() => {
        const saved = loadPos();
        if (saved) setPos(saved);
    }, []);

    // Close panel when clicking outside
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                handleRef.current &&
                !handleRef.current
                    .closest('.bucket-root')
                    ?.contains(e.target as Node)
            )
                setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const bucketed = layout.filter((w) => w.containerId === 'bucket');

    function widgetLabel(w: WidgetConfig) {
        const entry = getDashboardWidgetLibrary().find(
            (c) => c.type === w.type,
        );
        return entry ? `${entry.emoji} ${entry.name}` : w.type;
    }

    const onPointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            e.preventDefault();
            const el = handleRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            offset.current = {
                dx: e.clientX - rect.left,
                dy: e.clientY - rect.top,
            };
            startClient.current = { x: e.clientX, y: e.clientY };
            didDrag.current = false;
            el.setPointerCapture(e.pointerId);
        },
        [],
    );

    const onPointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            const dx = e.clientX - startClient.current.x;
            const dy = e.clientY - startClient.current.y;
            if (!dragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
                setDragging(true);
                setOpen(false);
                didDrag.current = true;
            }
            if (!dragging && Math.hypot(dx, dy) <= DRAG_THRESHOLD) return;

            const x = Math.max(
                0,
                Math.min(
                    e.clientX - offset.current.dx,
                    window.innerWidth - HANDLE_W,
                ),
            );
            const y = Math.max(
                0,
                Math.min(
                    e.clientY - offset.current.dy,
                    window.innerHeight - 80,
                ),
            );
            setPos({ x, y });
        },
        [dragging],
    );

    const onPointerUp = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            handleRef.current?.releasePointerCapture(e.pointerId);
            if (dragging) {
                const x = Math.max(
                    0,
                    Math.min(
                        e.clientX - offset.current.dx,
                        window.innerWidth - HANDLE_W,
                    ),
                );
                const y = Math.max(
                    0,
                    Math.min(
                        e.clientY - offset.current.dy,
                        window.innerHeight - 80,
                    ),
                );
                const final = { x, y };
                setPos(final);
                setDragging(false);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(final));
                } catch {
                    /* quota */
                }
            } else if (!didDrag.current) {
                setOpen((v) => !v);
            }
            didDrag.current = false;
        },
        [dragging],
    );

    const openLeft =
        pos.x > (typeof window !== 'undefined' ? window.innerWidth / 2 : 400);

    return (
        <div
            className="bucket-root fixed z-40 flex items-start"
            style={{ left: pos.x, top: pos.y }}
        >
            {/* Panel — left side when handle is on right half */}
            {openLeft && open && (
                <BucketPanel
                    bucketed={bucketed}
                    widgetLabel={widgetLabel}
                    onRestore={onRestore}
                    onRemove={onRemove}
                    onClose={() => setOpen(false)}
                />
            )}

            {/* Drag handle / toggle */}
            <div
                ref={handleRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className={cn(
                    'flex flex-col items-center justify-center gap-1.5 py-4 px-1.5 rounded-xl select-none transition-colors',
                    dragging
                        ? 'cursor-grabbing shadow-2xl scale-110'
                        : 'cursor-grab',
                    open
                        ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'
                        : 'bg-white dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700',
                )}
            >
                <GripVertical size={10} className="opacity-50" />
                <Archive size={14} />
                {bucketed.length > 0 && (
                    <span
                        className={cn(
                            'text-[9px] font-bold min-w-3.5 text-center',
                            open
                                ? 'text-white dark:text-zinc-900'
                                : 'text-zinc-500 dark:text-zinc-400',
                        )}
                    >
                        {bucketed.length}
                    </span>
                )}
            </div>

            {/* Panel — right side when handle is on left half */}
            {!openLeft && open && (
                <BucketPanel
                    bucketed={bucketed}
                    widgetLabel={widgetLabel}
                    onRestore={onRestore}
                    onRemove={onRemove}
                    onClose={() => setOpen(false)}
                />
            )}
        </div>
    );
}

function BucketPanel({
    bucketed,
    widgetLabel,
    onRestore,
    onRemove,
    onClose,
}: {
    bucketed: WidgetConfig[];
    widgetLabel: (w: WidgetConfig) => string;
    onRestore: (id: string) => void;
    onRemove: (id: string) => void;
    onClose: () => void;
}) {
    return (
        <div className="w-56 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Widget Bucket
                </p>
                <button
                    onClick={onClose}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                    <X size={13} />
                </button>
            </div>
            <div className="max-h-72 overflow-y-auto no-scrollbar">
                {bucketed.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-6 text-zinc-400 dark:text-zinc-600">
                        <Archive size={18} className="opacity-40" />
                        <p className="text-xs">Empty bucket</p>
                    </div>
                ) : (
                    <div className="p-2 space-y-1">
                        {bucketed.map((w) => (
                            <div
                                key={w.id}
                                className="flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 group"
                            >
                                <span className="flex-1 text-xs font-semibold text-zinc-700 dark:text-zinc-300 truncate">
                                    {widgetLabel(w)}
                                </span>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => onRestore(w.id)}
                                        title="Restore to dashboard"
                                        className="p-1 rounded-lg text-zinc-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                    >
                                        <ArchiveRestore size={12} />
                                    </button>
                                    <button
                                        onClick={() => onRemove(w.id)}
                                        title="Remove permanently"
                                        className="p-1 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
