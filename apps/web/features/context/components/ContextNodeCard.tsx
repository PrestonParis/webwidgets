'use client';

import {
    ArrowDownToLine,
    ArrowUpFromLine,
    Bot,
    Brain,
    Cable,
    FileText,
    Goal,
    Lightbulb,
    Network,
    Puzzle,
    Tag,
    User,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ContextNodeCardProps } from '@/features/context/types/context';
import { NODE_COLORS, NODE_SIZES } from '@/features/context/lib/graphBuilder';
import {
    LAYER_META,
    getEntryLayer,
    resolveWidgetType,
} from '@/features/context/lib/contextLayers';
import { getWidgetManifest } from '@/features/dashboard/runtime/widgetManifestRegistry';

function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(ms) || ms < 0) return '';
    const minutes = Math.floor(ms / 60_000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

const TYPE_ICON: Record<string, LucideIcon> = {
    profile: User,
    goal: Goal,
    widget: Puzzle,
    integration: Cable,
    query_gist: Brain,
    insight: Lightbulb,
    workflow: Network,
    automation: Bot,
    file: FileText,
    note: FileText,
    memory: Brain,
    tag: Tag,
};

export function ContextNodeCard({
    node,
    selected,
    dimmed = false,
    onClick,
    onPointerDown,
    onDoubleClick,
    lockLayout = false,
}: ContextNodeCardProps) {
    const color = NODE_COLORS[node.entryType] ?? '#6b7280';
    const Icon = TYPE_ICON[node.entryType] ?? Network;
    const source = String(
        node.sourceType ?? node.data.category ?? node.entryType,
    );
    const connections = node.connectionCount ?? 0;
    const activity = node.activityScore ?? 0;
    const x = Number.isFinite(node.x) ? node.x : 500;
    const y = Number.isFinite(node.y) ? node.y : 380;
    const layer = getEntryLayer(node);
    const layerColor = layer === 'root' ? color : LAYER_META[layer].color;
    const widgetType =
        node.entryType === 'widget' ? resolveWidgetType(node) : undefined;
    const context = widgetType ? getWidgetManifest(widgetType)?.context : null;
    const producesType = context?.producedNodeTypes?.[0];
    const consumesType = context?.consumedNodeTypes?.[0];
    const lastUsed = timeAgo(node.updatedAt);

    return (
        <button
            type="button"
            data-context-node="true"
            onClick={() => onClick(node.entityId)}
            onDoubleClick={() => onDoubleClick?.(node.entityId)}
            onPointerDown={(event) => onPointerDown?.(node.entityId, event)}
            className={`absolute rounded-lg border bg-white text-left shadow-sm transition hover:shadow-md dark:bg-zinc-950 ${
                lockLayout
                    ? 'cursor-pointer'
                    : 'cursor-grab active:cursor-grabbing'
            }`}
            style={{
                left: x - 82,
                top: y - 54,
                width: 164,
                minHeight: 108,
                borderColor: selected ? color : `${color}55`,
                boxShadow: selected ? `0 0 0 3px ${color}30` : undefined,
                opacity: dimmed ? 0.35 : 1,
                zIndex: selected ? 10 : 1,
                overflow: 'hidden',
            }}
            title={node.label}
            aria-label={`${node.entryType}: ${node.label}`}
        >
            {layer !== 'root' && (
                <div
                    className="h-0.75 w-full"
                    style={{ backgroundColor: layerColor }}
                />
            )}
            <div className="flex items-start gap-2 p-2.5">
                <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${color}18`, color }}
                >
                    <Icon size={17} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block text-xs font-semibold leading-snug text-zinc-900 dark:text-zinc-100">
                        {node.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-zinc-500">
                        {node.entryType} · {source}
                    </span>
                </span>
            </div>
            <div className="grid grid-cols-2 border-t border-zinc-100 text-[10px] dark:border-zinc-800">
                <span className="px-2 py-1 text-zinc-500">
                    {connections} links
                </span>
                <span className="px-2 py-1 text-right text-zinc-500">
                    {activity > 0 ? `${activity}% active` : 'quiet'}
                </span>
            </div>
            {(consumesType || producesType || lastUsed) && (
                <div className="flex items-center gap-2 border-t border-zinc-100 px-2 py-1 text-[9px] text-zinc-400 dark:border-zinc-800">
                    {consumesType && (
                        <span
                            className="inline-flex items-center gap-0.5"
                            title={`Consumes ${consumesType}`}
                        >
                            <ArrowDownToLine size={9} />
                            {consumesType}
                        </span>
                    )}
                    {producesType && (
                        <span
                            className="inline-flex items-center gap-0.5"
                            title={`Produces ${producesType}`}
                        >
                            <ArrowUpFromLine size={9} />
                            {producesType}
                        </span>
                    )}
                    {lastUsed && (
                        <span className="ml-auto shrink-0">{lastUsed}</span>
                    )}
                </div>
            )}
        </button>
    );
}
