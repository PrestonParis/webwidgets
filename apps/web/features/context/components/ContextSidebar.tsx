'use client';

import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import type { ContextSidebarProps } from '@/features/context/types/context';
import { NODE_COLORS } from '@/features/context/lib/graphBuilder';

function DataRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-xs text-gray-400 uppercase tracking-wide">
                {label}
            </span>
            <span className="text-sm text-gray-700 dark:text-zinc-300 wrap-break-word">
                {value}
            </span>
        </div>
    );
}

export function ContextSidebar({
    node,
    onClose,
    onDelete,
}: ContextSidebarProps) {
    const [confirmDelete, setConfirmDelete] = useState(false);

    if (!node) return null;
    const color = NODE_COLORS[node.entryType] ?? '#6b7280';
    const dataEntries = Object.entries(node.data).filter(
        ([, v]) => v !== null && v !== '',
    );

    return (
        <div className="flex flex-col h-full w-72 border-l border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shrink-0">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                    <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium uppercase tracking-wide text-gray-400">
                        {node.entryType.replace('_', ' ')}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                    <X className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-zinc-100">
                    {node.label}
                </h3>

                {dataEntries.length > 0 && (
                    <div className="space-y-3">
                        {dataEntries.map(([key, val]) => (
                            <DataRow
                                key={key}
                                label={key}
                                value={String(val)}
                            />
                        ))}
                    </div>
                )}

                {node.linkedTo.length > 0 && (
                    <div>
                        <span className="text-xs text-gray-400 uppercase tracking-wide">
                            Linked to
                        </span>
                        <ul className="mt-1 space-y-1">
                            {node.linkedTo.map((id) => (
                                <li
                                    key={id}
                                    className="text-sm text-gray-600 dark:text-zinc-400 truncate"
                                >
                                    {id}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <DataRow label="Entity ID" value={node.entityId} />
                <DataRow
                    label="Last updated"
                    value={new Date(node.updatedAt).toLocaleString()}
                />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
                {confirmDelete ? (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onDelete(node.entityId)}
                            className="flex-1 py-1.5 text-xs bg-red-500 hover:bg-red-600 text-white rounded-lg"
                        >
                            Confirm remove
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 py-1.5 text-xs border rounded-lg text-gray-600 dark:text-zinc-400"
                        >
                            Cancel
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={() => setConfirmDelete(true)}
                        className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove from context
                    </button>
                )}
            </div>
        </div>
    );
}
