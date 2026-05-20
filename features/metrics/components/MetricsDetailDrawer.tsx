'use client';

import { useState } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';

interface MetricsDetailDrawerProps {
    title: string;
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export function MetricsDetailDrawer({
    title,
    open,
    onClose,
    children,
}: MetricsDetailDrawerProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full max-w-lg bg-white dark:bg-zinc-950 border-l border-gray-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-800">
                    <h2 className="font-semibold text-gray-900 dark:text-zinc-100">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {children}
                </div>
            </div>
        </div>
    );
}

interface JsonViewerProps {
    data: Record<string, unknown>;
    label?: string;
}

function JsonViewerNode({ k, v }: { k: string; v: unknown }) {
    const [open, setOpen] = useState(false);
    const isObj = v !== null && typeof v === 'object';
    return (
        <div className="pl-3 border-l border-gray-100 dark:border-zinc-800">
            <button
                className="flex items-center gap-1 text-xs text-left w-full"
                onClick={() => isObj && setOpen((x) => !x)}
            >
                {isObj ? (
                    open ? (
                        <ChevronDown size={10} />
                    ) : (
                        <ChevronRight size={10} />
                    )
                ) : (
                    <span className="w-2.5" />
                )}
                <span className="text-gray-600 dark:text-zinc-400 font-mono">
                    {k}:
                </span>
                {!isObj && (
                    <span className="text-gray-900 dark:text-zinc-100 font-mono truncate">
                        {JSON.stringify(v)}
                    </span>
                )}
            </button>
            {isObj && open && (
                <div className="mt-0.5">
                    {Object.entries(v as Record<string, unknown>).map(
                        ([ck, cv]) => (
                            <JsonViewerNode key={ck} k={ck} v={cv} />
                        ),
                    )}
                </div>
            )}
        </div>
    );
}

export function MetricsJsonViewer({ data, label }: JsonViewerProps) {
    return (
        <div className="space-y-1">
            {label && (
                <p className="text-xs font-medium text-gray-500 dark:text-zinc-500 mb-1">
                    {label}
                </p>
            )}
            <div className="rounded-lg bg-gray-50 dark:bg-zinc-800/60 p-3 space-y-0.5 text-xs font-mono">
                {Object.entries(data).map(([k, v]) => (
                    <JsonViewerNode key={k} k={k} v={v} />
                ))}
            </div>
        </div>
    );
}
