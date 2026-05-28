'use client';

import { useState, useEffect } from 'react';
import { useDashboardRuntime } from './DashboardRuntimeProvider';
import {
    DEV_RUNTIME_INSPECTOR_STORAGE_KEY,
    DEV_RUNTIME_INSPECTOR_SHORTCUT,
} from './dashboardRuntimeConfig';

/**
 * Dev-only runtime inspector for debugging dashboard runtime behavior.
 * This component should only be visible in development environments.
 *
 * Features:
 * - Toggle visibility with keyboard shortcut (Ctrl/Cmd + Shift + D)
 * - Shows queued, hydrating, hydrated, and failed widgets
 * - Displays active fetches, paused state, and pressure level
 * - Persist visibility state in localStorage
 */
export function RuntimeInspector() {
    if (process.env.NODE_ENV === 'production') return null;

    const { state, snapshot } = useDashboardRuntime();
    const [visible, setVisible] = useState(false);
    const [expanded, setExpanded] = useState(false);

    // Load visibility from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(
                DEV_RUNTIME_INSPECTOR_STORAGE_KEY,
            );
            if (stored === 'true') setVisible(true);
        } catch {
            // Ignore localStorage errors
        }
    }, []);

    // Save visibility to localStorage when changed
    useEffect(() => {
        try {
            localStorage.setItem(
                DEV_RUNTIME_INSPECTOR_STORAGE_KEY,
                String(visible),
            );
        } catch {
            // Ignore localStorage errors
        }
    }, [visible]);

    // Keyboard shortcut to toggle
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                setVisible((v) => !v);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    if (!visible) return null;

    const widgetRecords = Array.from(state.records.values());
    const queuedWidgets = widgetRecords.filter(
        (r) => !state.loadedIds.has(r.id) && r.status === 'idle',
    );
    const hydratingWidgets = widgetRecords.filter((r) =>
        state.activeHydrationIds.has(r.id),
    );
    const hydratedWidgets = widgetRecords.filter((r) =>
        state.hydratedIds.has(r.id),
    );
    const failedWidgets = widgetRecords.filter((r) =>
        state.failedIds.has(r.id),
    );

    return (
        <div className="fixed top-4 right-4 z-50 w-80 max-h-[80vh] overflow-auto rounded-lg border border-zinc-200 bg-white/95 p-4 text-xs shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 dark:text-zinc-300">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm">Runtime Inspector</h3>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                        {expanded ? '▼' : '▶'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setVisible(false)}
                        className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                    >
                        ✕
                    </button>
                </div>
            </div>

            <div className="space-y-2 mb-3">
                <div className="flex justify-between">
                    <span className="text-zinc-500">Registered:</span>
                    <span className="font-semibold">{snapshot.registered}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Loaded:</span>
                    <span className="font-semibold">{snapshot.loaded}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Visible:</span>
                    <span className="font-semibold">{snapshot.visible}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Near-visible:</span>
                    <span className="font-semibold">
                        {snapshot.nearVisible}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Offscreen:</span>
                    <span className="font-semibold">{snapshot.offscreen}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Background:</span>
                    <span className="font-semibold">{snapshot.background}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Hydrated:</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                        {snapshot.hydrated}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Failed:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                        {snapshot.failed}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Active Fetches:</span>
                    <span className="font-semibold">
                        {snapshot.activeFetches}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Hydrating:</span>
                    <span className="font-semibold">
                        {snapshot.activeHydrations}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span className="text-zinc-500">Pressure:</span>
                    <span
                        className={`font-semibold ${
                            snapshot.pressure === 'high'
                                ? 'text-red-600 dark:text-red-400'
                                : snapshot.pressure === 'moderate'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-green-600 dark:text-green-400'
                        }`}
                    >
                        {snapshot.pressure}
                    </span>
                </div>
                {snapshot.paused && (
                    <div className="flex justify-between">
                        <span className="text-zinc-500">Status:</span>
                        <span className="font-semibold text-amber-600 dark:text-amber-400">
                            PAUSED
                        </span>
                    </div>
                )}
            </div>

            {expanded && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-3">
                    {queuedWidgets.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-1 text-zinc-600 dark:text-zinc-400">
                                Queued ({queuedWidgets.length})
                            </h4>
                            <div className="space-y-1 max-h-32 overflow-auto">
                                {queuedWidgets.map((w) => (
                                    <div
                                        key={w.id}
                                        className="flex justify-between text-[10px]"
                                    >
                                        <span className="truncate">{w.id}</span>
                                        <span className="text-zinc-400">
                                            {w.metadata.priority}/
                                            {w.metadata.weight}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {hydratingWidgets.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-1 text-blue-600 dark:text-blue-400">
                                Hydrating ({hydratingWidgets.length})
                            </h4>
                            <div className="space-y-1 max-h-32 overflow-auto">
                                {hydratingWidgets.map((w) => (
                                    <div key={w.id} className="text-[10px]">
                                        {w.id}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {failedWidgets.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-1 text-red-600 dark:text-red-400">
                                Failed ({failedWidgets.length})
                            </h4>
                            <div className="space-y-1 max-h-32 overflow-auto">
                                {failedWidgets.map((w) => (
                                    <div
                                        key={w.id}
                                        className="flex justify-between text-[10px]"
                                    >
                                        <span className="truncate">{w.id}</span>
                                        <span className="text-zinc-400">
                                            fails: {w.failureCount}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800 text-[10px] text-zinc-400">
                Press {DEV_RUNTIME_INSPECTOR_SHORTCUT} to toggle
            </div>
        </div>
    );
}
