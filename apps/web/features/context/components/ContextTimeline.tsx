'use client';

import { Radio } from 'lucide-react';
import type { ContextGraph } from '@/features/context/types/context';

interface ContextTimelineProps {
    graph: ContextGraph;
    onSelectNode: (entityId: string) => void;
}

export function ContextTimeline({ graph, onSelectNode }: ContextTimelineProps) {
    const recent = [...graph.nodes]
        .sort(
            (a, b) =>
                new Date(b.updatedAt).getTime() -
                new Date(a.updatedAt).getTime(),
        )
        .slice(0, 8);

    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Context Timeline
                </h2>
                <Radio size={14} className="text-zinc-400" />
            </div>
            <div className="space-y-1">
                {recent.map((node) => (
                    <button
                        key={node.entityId}
                        type="button"
                        onClick={() => onSelectNode(node.entityId)}
                        className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    >
                        <span className="min-w-0">
                            <span className="block truncate text-xs font-medium text-zinc-800 dark:text-zinc-100">
                                {node.label}
                            </span>
                            <span className="block text-[10px] text-zinc-500">
                                {node.entryType.replace('_', ' ')}
                            </span>
                        </span>
                        <span className="shrink-0 text-[10px] text-zinc-400">
                            {new Date(node.updatedAt).toLocaleDateString()}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}
