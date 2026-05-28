'use client';

import { Activity, Bell, CircleDot, ExternalLink, Tag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type {
    ContextGraph,
    ContextNode,
} from '@/features/context/types/context';

interface NodeInspectorProps {
    node: ContextNode;
    graph: ContextGraph;
    onSelectNode: (entityId: string) => void;
}

export function NodeInspector({
    node,
    graph,
    onSelectNode,
}: NodeInspectorProps) {
    const connectedEdges = graph.edges.filter(
        (edge) => edge.from === node.entityId || edge.to === node.entityId,
    );
    const connectedNodes = connectedEdges
        .map((edge) => (edge.from === node.entityId ? edge.to : edge.from))
        .map((id) => graph.nodes.find((item) => item.entityId === id))
        .filter(Boolean) as ContextNode[];
    const dataEntries = Object.entries(node.data).filter(
        ([, value]) => value !== null && value !== '',
    );
    const tags = [
        node.entryType,
        String(node.data.category ?? ''),
        ...String(node.data.tags ?? '')
            .split(',')
            .map((tag) => tag.trim()),
    ].filter(Boolean);

    return (
        <div className="space-y-4">
            <section>
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                            {node.entryType.replace('_', ' ')}
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                            {node.label}
                        </h2>
                    </div>
                    {node.entryType === 'widget' && (
                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-zinc-800 dark:text-zinc-300"
                        >
                            <ExternalLink size={13} />
                            Open
                        </Link>
                    )}
                </div>
                {typeof node.data.description === 'string' &&
                    node.data.description.length > 0 && (
                        <p className="mt-2 text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                            {node.data.description}
                        </p>
                    )}
            </section>

            <section className="grid grid-cols-3 gap-2">
                <Stat
                    label="Links"
                    value={String(connectedEdges.length)}
                    icon={CircleDot}
                />
                <Stat
                    label="Activity"
                    value={`${node.activityScore ?? 0}%`}
                    icon={Activity}
                />
                <Stat
                    label="Alerts"
                    value={String(node.data.unread ?? node.data.alerts ?? 0)}
                    icon={Bell}
                />
            </section>

            {tags.length > 0 && (
                <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Tags
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-1 text-[11px] text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300"
                            >
                                <Tag size={10} />
                                {tag}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {connectedNodes.length > 0 && (
                <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Connected Widgets And Context
                    </h3>
                    <div className="space-y-1.5">
                        {connectedNodes.slice(0, 8).map((item) => (
                            <button
                                key={item.entityId}
                                type="button"
                                onClick={() => onSelectNode(item.entityId)}
                                className="flex w-full items-center justify-between rounded-lg border border-zinc-100 px-3 py-2 text-left text-sm transition hover:border-blue-200 dark:border-zinc-800"
                            >
                                <span className="truncate text-zinc-800 dark:text-zinc-100">
                                    {item.label}
                                </span>
                                <span className="shrink-0 text-[10px] text-zinc-400">
                                    {item.entryType.replace('_', ' ')}
                                </span>
                            </button>
                        ))}
                    </div>
                </section>
            )}

            {dataEntries.length > 0 && (
                <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Stored Context
                    </h3>
                    <div className="space-y-2">
                        {dataEntries.map(([key, value]) => (
                            <div
                                key={key}
                                className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-900"
                            >
                                <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                    {key}
                                </p>
                                <p className="mt-1 wrap-break-word text-xs text-zinc-700 dark:text-zinc-300">
                                    {String(value)}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Context Timeline
                </h3>
                <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    Last updated {new Date(node.updatedAt).toLocaleString()}
                </div>
            </section>
        </div>
    );
}

function Stat({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: string;
    icon: LucideIcon;
}) {
    return (
        <div className="rounded-lg border border-zinc-200 p-2 dark:border-zinc-800">
            <div className="flex items-center justify-between">
                <p className="text-[10px] text-zinc-500">{label}</p>
                <Icon size={12} className="text-zinc-400" />
            </div>
            <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {value}
            </p>
        </div>
    );
}
