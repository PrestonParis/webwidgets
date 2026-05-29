'use client';

import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import type { ContextSidebarProps } from '@/features/context/types/context';
import { NODE_COLORS } from '@/features/context/lib/graphBuilder';
import { NodeInspector } from './NodeInspector';
import { RelationshipEditor } from './RelationshipEditor';

export function ContextSidebar({
    node,
    graph,
    onSelectNode,
    onUpsert,
    onClose,
    onDelete,
}: ContextSidebarProps) {
    const [tab, setTab] = useState<'inspect' | 'edit'>('inspect');
    const [confirmDelete, setConfirmDelete] = useState(false);

    if (!node) return null;
    const color = NODE_COLORS[node.entryType] ?? '#6b7280';

    return (
        <aside className="flex h-full w-96 shrink-0 flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                            Node Inspector
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label="Close inspector"
                    >
                        <X className="h-4 w-4 text-zinc-400" />
                    </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => setTab('inspect')}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                            tab === 'inspect'
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300'
                        }`}
                    >
                        Inspect
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab('edit')}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                            tab === 'edit'
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300'
                        }`}
                    >
                        Relationships
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {tab === 'inspect' ? (
                    <NodeInspector
                        node={node}
                        graph={graph}
                        onSelectNode={onSelectNode}
                    />
                ) : (
                    <RelationshipEditor
                        node={node}
                        graph={graph}
                        onUpsert={onUpsert}
                        onSelectNode={onSelectNode}
                    />
                )}
            </div>

            <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
                {confirmDelete ? (
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => onDelete(node.entityId)}
                            className="flex-1 rounded-lg bg-red-500 py-1.5 text-xs text-white hover:bg-red-600"
                        >
                            Confirm remove
                        </button>
                        <button
                            type="button"
                            onClick={() => setConfirmDelete(false)}
                            className="flex-1 rounded-lg border py-1.5 text-xs text-zinc-600 dark:text-zinc-400"
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
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove from context
                    </button>
                )}
            </div>
        </aside>
    );
}
