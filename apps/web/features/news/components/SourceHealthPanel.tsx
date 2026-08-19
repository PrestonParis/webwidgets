import Link from 'next/link';
import { AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import type {
    SourceHealthState,
    TimelineSourceHealth,
} from '@/features/news/types/timelineFeed';

const healthLabels: Record<SourceHealthState, string> = {
    connected: 'Connected',
    syncing: 'Syncing',
    healthy: 'Healthy',
    stale: 'Stale',
    failing: 'Failing',
    disabled: 'Disabled',
    reconnect_required: 'Reconnect required',
};

function StatusIcon({ health }: { health: SourceHealthState }) {
    if (health === 'healthy' || health === 'connected')
        return (
            <CheckCircle2 aria-hidden size={15} className="text-emerald-500" />
        );
    if (health === 'syncing')
        return (
            <RefreshCw
                aria-hidden
                size={15}
                className="animate-spin text-blue-500"
            />
        );
    return <AlertTriangle aria-hidden size={15} className="text-amber-500" />;
}

function lastSyncLabel(value: string | null) {
    if (!value) return 'No successful sync yet';
    return `Last success ${new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))}`;
}

export function SourceHealthPanel({
    sources,
    unavailable,
}: {
    sources: TimelineSourceHealth[];
    unavailable: boolean;
}) {
    return (
        <section aria-labelledby="source-health-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2
                    id="source-health-heading"
                    className="text-sm font-semibold"
                >
                    Source health
                </h2>
                <Link
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400"
                    href="/integrations"
                >
                    Manage sources
                </Link>
            </div>
            {unavailable ? (
                <p
                    className="rounded-md bg-amber-50 p-3 text-xs text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                    role="status"
                >
                    Events are available, but source health could not be loaded.
                </p>
            ) : null}
            {!unavailable && sources.length === 0 ? (
                <p className="text-sm text-zinc-500">
                    No external sources connected.
                </p>
            ) : null}
            <ul className="space-y-2">
                {sources.map((source) => (
                    <li
                        className="rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
                        key={source.id}
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <StatusIcon health={source.health} />
                            <span className="min-w-0 flex-1 truncate">
                                {source.label}
                            </span>
                            <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                                {healthLabels[source.health]}
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500">
                            {lastSyncLabel(source.lastSucceededAt)}
                            {source.failureCount
                                ? ` · ${source.failureCount} failures`
                                : ''}
                        </p>
                    </li>
                ))}
            </ul>
        </section>
    );
}
