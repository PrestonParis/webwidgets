'use client';

import {
    StatusBadge,
    Panel,
    type DeveloperWorkspaceSnapshot,
} from './DevShared';

export function DevOverview({ data }: { data: DeveloperWorkspaceSnapshot }) {
    const providerFailures = data.providers.filter(
        (p) => p.status !== 'healthy',
    ).length;
    const queueFailures = data.queues.filter(
        (q) => q.status === 'unhealthy' || q.status === 'degraded',
    ).length;

    return (
        <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <Panel title="System Health">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {data.overview.map((check) => (
                        <div
                            key={check.id}
                            className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium">
                                        {check.label}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                        {check.source}
                                    </p>
                                </div>
                                <StatusBadge status={check.status} />
                            </div>
                            {check.detail && (
                                <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
                                    {check.detail}
                                </p>
                            )}
                            {typeof check.latencyMs === 'number' && (
                                <p className="mt-2 text-xs text-zinc-500">
                                    {check.latencyMs} ms
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </Panel>
            <Panel title="Operational Risks">
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span>Provider failures</span>
                        <strong>{providerFailures}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Queue issues</span>
                        <strong>{queueFailures}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Discovered API routes</span>
                        <strong>{data.routes.length}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Schema tables</span>
                        <strong>{data.schema.tables.length}</strong>
                    </div>
                </div>
            </Panel>
            <Panel title="Audit Notes">
                <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                    {data.audit.map((item) => (
                        <li key={item}>{item}</li>
                    ))}
                </ul>
            </Panel>
        </div>
    );
}
