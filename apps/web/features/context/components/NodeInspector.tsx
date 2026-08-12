'use client';

import {
    Activity,
    ArrowDownToLine,
    ArrowUpFromLine,
    Bell,
    CircleDot,
    ExternalLink,
    Tag,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type {
    ContextGraph,
    ContextNode,
} from '@/features/context/types/context';
import { resolveWidgetType } from '@/features/context/lib/contextLayers';
import { getWidgetManifest } from '@/features/dashboard/runtime/widgetManifestRegistry';

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
    const nodeById = (id: string) =>
        graph.nodes.find((item) => item.entityId === id);
    const consumesNodes = connectedEdges
        .filter((edge) => edge.to === node.entityId && edge.kind === 'consumed_by')
        .map((edge) => nodeById(edge.from))
        .filter(Boolean) as ContextNode[];
    const producesNodes = connectedEdges
        .filter((edge) => edge.to === node.entityId && edge.kind === 'produced_by')
        .map((edge) => nodeById(edge.from))
        .filter(Boolean) as ContextNode[];
    const usedByNodes = connectedEdges
        .filter((edge) => edge.from === node.entityId && edge.kind === 'used_by')
        .map((edge) => nodeById(edge.to))
        .filter(Boolean) as ContextNode[];

    // Fresh accounts may not have observed edges yet — fall back to what the
    // widget's manifest declares so the panel isn't empty right after
    // onboarding.
    const widgetType =
        node.entryType === 'widget' ? resolveWidgetType(node) : undefined;
    const manifestContext = widgetType
        ? getWidgetManifest(widgetType)?.context
        : null;
    const declaredConsumed =
        consumesNodes.length === 0 ? manifestContext?.consumedNodeTypes ?? [] : [];
    const declaredProduced =
        producesNodes.length === 0 ? manifestContext?.producedNodeTypes ?? [] : [];
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
                {(node.summary ||
                    (typeof node.data.description === 'string' &&
                        node.data.description.length > 0)) && (
                    <div className="mt-3">
                        <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                            Purpose
                        </h3>
                        <p className="text-sm leading-5 text-zinc-600 dark:text-zinc-300">
                            {node.summary ?? String(node.data.description)}
                        </p>
                    </div>
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

            <RelationshipList
                title="Consumes"
                icon={ArrowDownToLine}
                nodes={consumesNodes}
                declared={declaredConsumed}
                onSelectNode={onSelectNode}
            />
            <RelationshipList
                title="Produces"
                icon={ArrowUpFromLine}
                nodes={producesNodes}
                declared={declaredProduced}
                onSelectNode={onSelectNode}
            />
            <RelationshipList
                title="Used by"
                icon={Users}
                nodes={usedByNodes}
                onSelectNode={onSelectNode}
            />

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
                    Provenance
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                        ['Source', node.sourceType ?? 'manual'],
                        ['Source ID', node.sourceId ?? node.entityId],
                        ['Created by', node.createdByType ?? 'user'],
                        ['Confidence', String(node.confidence ?? 1)],
                        ['Status', node.status ?? 'active'],
                        ['Observed', node.lastObservedAt ?? node.updatedAt],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="rounded-lg bg-zinc-50 p-2 dark:bg-zinc-900"
                        >
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                                {label}
                            </p>
                            <p className="mt-1 truncate text-zinc-700 dark:text-zinc-300">
                                {value}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {connectedEdges.length > 0 && (
                <section>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        Relationship Evidence
                    </h3>
                    <div className="space-y-1.5">
                        {connectedEdges.slice(0, 8).map((edge, index) => (
                            <div
                                key={
                                    edge.id ??
                                    `${edge.from}-${edge.to}-${index}`
                                }
                                className="rounded-lg border border-zinc-100 p-2 text-xs dark:border-zinc-800"
                            >
                                <p className="font-medium text-zinc-700 dark:text-zinc-200">
                                    {edge.kind ?? 'relates_to'}
                                    {edge.label ? `: ${edge.label}` : ''}
                                </p>
                                <p className="mt-1 text-zinc-500">
                                    confidence {edge.confidence ?? 1} ·{' '}
                                    {edge.sourceType ?? 'manual'} ·{' '}
                                    {edge.createdByType ?? 'user'}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <section>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Last Used
                </h3>
                <div className="rounded-lg bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
                    Last updated {new Date(node.updatedAt).toLocaleString()}
                </div>
            </section>
        </div>
    );
}

function RelationshipList({
    title,
    icon: Icon,
    nodes,
    declared = [],
    onSelectNode,
}: {
    title: string;
    icon: LucideIcon;
    nodes: ContextNode[];
    declared?: string[];
    onSelectNode: (entityId: string) => void;
}) {
    if (nodes.length === 0 && declared.length === 0) return null;
    return (
        <section>
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <Icon size={12} />
                {title}
            </h3>
            <div className="space-y-1.5">
                {nodes.map((item) => (
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
                {declared.map((type) => (
                    <div
                        key={type}
                        className="flex items-center justify-between rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-800"
                    >
                        <span>{type.replace('_', ' ')}</span>
                        <span className="shrink-0 text-[10px] text-zinc-400">
                            declared, not yet observed
                        </span>
                    </div>
                ))}
            </div>
        </section>
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
