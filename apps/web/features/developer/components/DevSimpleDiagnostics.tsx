'use client';

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import JsonView from '@uiw/react-json-view';
import {
    StatusBadge,
    Panel,
    Unavailable,
    type DeveloperWorkspaceSnapshot,
    type SectionId,
} from './DevShared';

export function DevSimpleDiagnostics({
    data,
    id,
}: {
    data: DeveloperWorkspaceSnapshot;
    id: SectionId;
}) {
    if (id === 'realtime') {
        return (
            <Panel title="Realtime + WebSocket Diagnostics">
                <Unavailable>
                    Supabase realtime client hooks were not found during this
                    audit. Adapter boundary is present, but active subscription
                    telemetry is not exported yet.
                </Unavailable>
            </Panel>
        );
    }
    if (id === 'network') {
        return (
            <Panel title="Request + Network Diagnostics">
                <div className="grid gap-3 md:grid-cols-2">
                    {[
                        data.requests.orchestrator,
                        data.requests.deduplication,
                    ].map((check) => (
                        <div
                            key={check.id}
                            className="rounded border border-zinc-200 p-3 dark:border-zinc-800"
                        >
                            <div className="flex justify-between gap-3">
                                <span>{check.label}</span>
                                <StatusBadge status={check.status} />
                            </div>
                            <p className="mt-2 text-sm text-zinc-500">
                                {check.detail}
                            </p>
                        </div>
                    ))}
                </div>
            </Panel>
        );
    }
    if (id === 'metrics') {
        return (
            <Panel title="Metrics + Resource Monitoring">
                <JsonView value={data.metrics} collapsed={2} />
            </Panel>
        );
    }
    if (id === 'integrations') {
        return (
            <Panel title="Integration Health">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {data.providers.map((provider) => (
                        <div
                            key={provider.id}
                            className="rounded border border-zinc-200 p-3 dark:border-zinc-800"
                        >
                            <div className="flex justify-between gap-3">
                                <span>{provider.label}</span>
                                <StatusBadge status={provider.status} />
                            </div>
                            <p className="mt-2 text-sm text-zinc-500">
                                {provider.detail}
                            </p>
                        </div>
                    ))}
                </div>
            </Panel>
        );
    }
    if (id === 'flags') {
        return (
            <Panel title="Feature Flags">
                {data.featureFlags.length ? (
                    <JsonView value={data.featureFlags} collapsed={2} />
                ) : (
                    <Unavailable>
                        No feature flags are available through Supabase, or the
                        feature_flags table is not reachable.
                    </Unavailable>
                )}
            </Panel>
        );
    }
    if (id === 'env') {
        return (
            <Panel title="Environment Validation">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {data.environment.map((item) => (
                        <div
                            key={item.name}
                            className="flex items-center justify-between rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                        >
                            <span>{item.name}</span>
                            {item.configured && !item.malformed ? (
                                <CheckCircle2
                                    className="text-emerald-500"
                                    size={16}
                                />
                            ) : item.required ? (
                                <XCircle className="text-red-500" size={16} />
                            ) : (
                                <AlertTriangle
                                    className="text-zinc-400"
                                    size={16}
                                />
                            )}
                        </div>
                    ))}
                </div>
            </Panel>
        );
    }
    if (id === 'errors') {
        return (
            <Panel title="Error Tracking">
                <Unavailable>
                    Sentry is instrumented. Issue ingestion requires a Sentry
                    API adapter and SENTRY_AUTH_TOKEN; no issues are fabricated
                    here.
                </Unavailable>
            </Panel>
        );
    }
    return (
        <Panel title="Storage + Upload Diagnostics">
            <Unavailable>
                Upload routes and Supabase/AWS storage clients exist, but no
                safe usage/failure telemetry endpoint is currently exported.
            </Unavailable>
        </Panel>
    );
}
