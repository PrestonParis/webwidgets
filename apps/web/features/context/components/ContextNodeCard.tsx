'use client';

import {
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
}: ContextNodeCardProps) {
    const size = NODE_SIZES[node.entryType] ?? 46;
    const color = NODE_COLORS[node.entryType] ?? '#6b7280';
    const Icon = TYPE_ICON[node.entryType] ?? Network;
    const category = String(node.data.category ?? node.entryType);
    const connections = node.connectionCount ?? 0;
    const activity = node.activityScore ?? 0;

    return (
        <button
            type="button"
            onClick={() => onClick(node.entityId)}
            className="absolute rounded-lg border bg-white text-left shadow-sm transition hover:shadow-md dark:bg-zinc-950"
            style={{
                left: node.x - size,
                top: node.y - size / 2,
                width: 132,
                minHeight: 74,
                borderColor: selected ? color : `${color}55`,
                boxShadow: selected ? `0 0 0 3px ${color}30` : undefined,
                opacity: dimmed ? 0.35 : 1,
                zIndex: selected ? 10 : 1,
            }}
            title={node.label}
            aria-label={`${node.entryType}: ${node.label}`}
        >
            <div className="flex items-start gap-2 p-2.5">
                <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: `${color}18`, color }}
                >
                    <Icon size={16} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {node.label}
                    </span>
                    <span className="mt-0.5 block truncate text-[10px] text-zinc-500">
                        {category}
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
        </button>
    );
}
