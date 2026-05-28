'use client';

import { Activity, AlertTriangle, Network, Workflow } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ContextGraph } from '@/features/context/types/context';

interface GraphAnalyticsPanelProps {
    graph: ContextGraph;
    onSelectNode: (entityId: string) => void;
}

export function GraphAnalyticsPanel({
    graph,
    onSelectNode,
}: GraphAnalyticsPanelProps) {
    const mostConnected = [...graph.nodes].sort(
        (a, b) => (b.connectionCount ?? 0) - (a.connectionCount ?? 0),
    )[0];
    const orphaned = graph.nodes.filter(
        (node) => (node.connectionCount ?? 0) === 0,
    );
    const active = graph.nodes.filter(
        (node) => (node.activityScore ?? 0) >= 60,
    );
    const workflows = graph.edges.filter((edge) => edge.kind === 'workflow');

    return (
        <section className="grid gap-2 md:grid-cols-4">
            <InsightCard
                icon={Network}
                label="Most connected"
                value={mostConnected?.label ?? 'None'}
                detail={`${mostConnected?.connectionCount ?? 0} links`}
                {...(mostConnected
                    ? { onClick: () => onSelectNode(mostConnected.entityId) }
                    : {})}
            />
            <InsightCard
                icon={Workflow}
                label="Workflow links"
                value={String(workflows.length)}
                detail="inferred from real node labels"
            />
            <InsightCard
                icon={Activity}
                label="Active systems"
                value={String(active.length)}
                detail="recent context updates"
            />
            <InsightCard
                icon={AlertTriangle}
                label="Disconnected"
                value={String(orphaned.length)}
                detail="nodes without relationships"
            />
        </section>
    );
}

function InsightCard({
    icon: Icon,
    label,
    value,
    detail,
    onClick,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    detail: string;
    onClick?: () => void;
}) {
    const content = (
        <>
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-zinc-500">{label}</p>
                <Icon size={15} className="text-zinc-400" />
            </div>
            <p className="mt-2 truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {value}
            </p>
            <p className="mt-1 text-xs text-zinc-500">{detail}</p>
        </>
    );

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className="rounded-lg border border-zinc-200 bg-white p-3 text-left transition hover:border-blue-300 dark:border-zinc-800 dark:bg-zinc-950"
            >
                {content}
            </button>
        );
    }

    return (
        <div className="rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
            {content}
        </div>
    );
}
