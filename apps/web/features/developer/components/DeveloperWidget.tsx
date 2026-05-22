'use client';

import {
    AlertTriangle,
    CheckCircle2,
    Loader2,
    PlugZap,
    Server,
    Wrench,
} from 'lucide-react';
import WidgetShell from '@/features/widgets/components/WidgetShell';
import { useDeveloperWorkspace } from '@/features/developer/hooks/useDeveloperWorkspace';

export default function DeveloperWidget({
    widgetId = 'developer',
}: {
    widgetId?: string;
}) {
    const query = useDeveloperWorkspace();
    const data = query.data;
    const failing =
        data?.overview.filter((check) => check.status !== 'healthy').length ?? 0;
    const queueBacklog =
        data?.queues.reduce(
            (total, queue) =>
                total +
                (queue.counts?.waiting ?? 0) +
                (queue.counts?.delayed ?? 0),
            0,
        ) ?? 0;
    const providerFailures =
        data?.providers.filter((provider) => provider.status !== 'healthy')
            .length ?? 0;

    return (
        <WidgetShell
            icon={<Wrench size={16} />}
            title="Developer"
            badge={data ? `${failing} issues` : 'checking'}
            widgetId={widgetId}
            widgetType="developer"
            footerHref="/developer"
            footerLabel="Open workspace ->"
        >
            {query.isLoading && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                    <Loader2 className="animate-spin" size={16} />
                    Checking infrastructure
                </div>
            )}
            {query.isError && (
                <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    Developer diagnostics are unavailable for this session.
                </div>
            )}
            {data && (
                <div className="space-y-2.5">
                    <MetricRow
                        icon={<Server size={14} />}
                        label="Environment health"
                        value={failing === 0 ? 'Healthy' : `${failing} checks`}
                        ok={failing === 0}
                    />
                    <MetricRow
                        icon={<AlertTriangle size={14} />}
                        label="Queue backlog"
                        value={String(queueBacklog)}
                        ok={queueBacklog === 0}
                    />
                    <MetricRow
                        icon={<PlugZap size={14} />}
                        label="Provider failures"
                        value={String(providerFailures)}
                        ok={providerFailures === 0}
                    />
                    <MetricRow
                        icon={<CheckCircle2 size={14} />}
                        label="API routes"
                        value={String(data.routes.length)}
                        ok={data.routes.length > 0}
                    />
                </div>
            )}
        </WidgetShell>
    );
}

function MetricRow({
    icon,
    label,
    value,
    ok,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    ok: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                {icon}
                <span className="truncate">{label}</span>
            </div>
            <span
                className={
                    ok
                        ? 'text-xs font-semibold text-emerald-600 dark:text-emerald-300'
                        : 'text-xs font-semibold text-amber-600 dark:text-amber-300'
                }
            >
                {value}
            </span>
        </div>
    );
}
