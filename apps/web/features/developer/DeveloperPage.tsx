'use client';

import '@xyflow/react/dist/style.css';
import '@xterm/xterm/css/xterm.css';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import JsonView from '@uiw/react-json-view';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Terminal } from '@xterm/xterm';
import {
    Background,
    Controls,
    ReactFlow,
    type Edge,
    type Node,
} from '@xyflow/react';
import {
    AlertTriangle,
    Boxes,
    Braces,
    CheckCircle2,
    Clock3,
    Container,
    Database,
    Flag,
    Gauge,
    Globe2,
    KeyRound,
    Loader2,
    Network,
    PlugZap,
    RadioTower,
    Search,
    Server,
    ShieldAlert,
    UploadCloud,
    Wrench,
    XCircle,
} from 'lucide-react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import Header from '@/features/ui/components/Header';
import {
    apiTesterRequestSchema,
    type ApiTesterRequest,
    type ApiTesterResponse,
    type DeveloperWorkspaceSnapshot,
    type DiagnosticStatus,
} from '@/features/developer/schemas/infrastructureSchemas';
import { useDeveloperWorkspace } from '@/features/developer/hooks/useDeveloperWorkspace';
import { cn } from '@/lib/utils/utils';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
});

const nav = [
    ['overview', 'Infrastructure Overview', Server],
    ['api', 'API Tester', Globe2],
    ['logs', 'Logs Explorer', Braces],
    ['cron', 'Cron + Jobs', Clock3],
    ['queues', 'Queue + Workers', Boxes],
    ['docker', 'Docker + Containers', Container],
    ['schema', 'Database Schema Explorer', Database],
    ['realtime', 'Realtime + WebSocket Diagnostics', RadioTower],
    ['network', 'Request + Network Diagnostics', Network],
    ['metrics', 'Metrics + Resource Monitoring', Gauge],
    ['integrations', 'Integration Health', PlugZap],
    ['flags', 'Feature Flags', Flag],
    ['env', 'Environment Validation', KeyRound],
    ['errors', 'Error Tracking', ShieldAlert],
    ['storage', 'Storage + Upload Diagnostics', UploadCloud],
] as const;

type SectionId = (typeof nav)[number][0];

const statusStyles: Record<DiagnosticStatus, string> = {
    healthy: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
    degraded: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200',
    unhealthy: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200',
    unavailable: 'border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
    unknown: 'border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200',
};

function StatusBadge({ status }: { status: DiagnosticStatus }) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded border px-2 py-0.5 text-[11px] font-semibold uppercase',
                statusStyles[status],
            )}
        >
            {status}
        </span>
    );
}

function Panel({
    title,
    children,
    action,
}: {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </section>
    );
}

function Unavailable({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            {children}
        </div>
    );
}

function Overview({ data }: { data: DeveloperWorkspaceSnapshot }) {
    const providerFailures = data.providers.filter(
        (provider) => provider.status !== 'healthy',
    ).length;
    const queueFailures = data.queues.filter(
        (queue) => queue.status === 'unhealthy' || queue.status === 'degraded',
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

function ApiTester({ data }: { data: DeveloperWorkspaceSnapshot }) {
    const [response, setResponse] = useState<ApiTesterResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<ApiTesterRequest[]>([]);
    const [body, setBody] = useState('{\n  \n}');
    const [queryText, setQueryText] = useState('');
    const [headerText, setHeaderText] = useState('');
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
    const form = useForm<ApiTesterRequest>({
        resolver: zodResolver(apiTesterRequestSchema),
        defaultValues: {
            method: 'GET',
            path: data.routes[0]?.path ?? '/api/healthz',
            headers: {},
            query: {},
            body: '',
            includeCredentials: true,
            confirmedDestructive: false,
        },
    });
    const selectedMethod = form.watch('method');

    async function onSubmit(input: ApiTesterRequest) {
        setLoading(true);
        setError(null);
        try {
            const payload = {
                ...input,
                body: selectedMethod === 'GET' ? undefined : body,
                headers: parsePairs(headerText),
                query: parsePairs(queryText),
            };
            const res = await fetch('/api/developer/api-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error ?? 'Request failed');
            setResponse(json as ApiTesterResponse);
            setHistory((current) => [payload, ...current].slice(0, 12));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Request failed');
        } finally {
            setLoading(false);
        }
    }

    const curl = response
        ? `curl -X ${selectedMethod} '${form.watch('path')}'`
        : 'Run a request to generate cURL.';

    return (
        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <Panel title="Request Builder">
                <form
                    className="space-y-3"
                    onSubmit={form.handleSubmit(onSubmit)}
                >
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                        <select
                            className="rounded border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            {...form.register('method')}
                        >
                            {methods.map((method) => (
                                <option key={method}>{method}</option>
                            ))}
                        </select>
                        <input
                            list="developer-routes"
                            className="rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            {...form.register('path')}
                        />
                        <datalist id="developer-routes">
                            {data.routes.map((route) => (
                                <option key={route.path} value={route.path}>
                                    {route.methods.join(', ')}
                                </option>
                            ))}
                        </datalist>
                    </div>
                    <label className="block text-xs font-medium text-zinc-500">
                        Query params JSON
                        <textarea
                            className="mt-1 h-16 w-full rounded border border-zinc-300 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
                            placeholder='{"limit":"10"}'
                            value={queryText}
                            onChange={(event) => setQueryText(event.target.value)}
                        />
                    </label>
                    <label className="block text-xs font-medium text-zinc-500">
                        Headers JSON
                        <textarea
                            className="mt-1 h-16 w-full rounded border border-zinc-300 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
                            placeholder='{"x-request-id":"dev-test"}'
                            value={headerText}
                            onChange={(event) => setHeaderText(event.target.value)}
                        />
                    </label>
                    {selectedMethod !== 'GET' && (
                        <label className="block text-xs font-medium text-zinc-500">
                            JSON body
                            <div className="mt-1 overflow-hidden rounded border border-zinc-300 dark:border-zinc-700">
                                <MonacoEditor
                                    height="180px"
                                    language="json"
                                    value={body}
                                    onChange={(value) => setBody(value ?? '')}
                                    options={{
                                        minimap: { enabled: false },
                                        fontSize: 12,
                                    }}
                                />
                            </div>
                        </label>
                    )}
                    {selectedMethod !== 'GET' && (
                        <label className="flex items-center gap-2 text-sm">
                            <input
                                type="checkbox"
                                {...form.register('confirmedDestructive')}
                            />
                            Confirm mutating request
                        </label>
                    )}
                    <button
                        type="submit"
                        className="inline-flex w-full items-center justify-center gap-2 rounded bg-zinc-950 px-3 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-950"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Globe2 size={16} />}
                        Send request
                    </button>
                </form>
            </Panel>
            <div className="space-y-4">
                <Panel title="Response Inspector">
                    {error && <Unavailable>{error}</Unavailable>}
                    {!error && !response && (
                        <Unavailable>Run a real internal API request to inspect its response.</Unavailable>
                    )}
                    {response && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 text-sm">
                                <span>{response.status} {response.statusText}</span>
                                <span>{response.durationMs} ms</span>
                                <span>{response.contentType ?? 'unknown content type'}</span>
                            </div>
                            <JsonView value={safeJson(response.bodyText)} collapsed={2} />
                        </div>
                    )}
                </Panel>
                <Panel title="Generated Snippets">
                    <pre className="overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-50">
                        {curl}
                    </pre>
                </Panel>
                <Panel title="Request History">
                    {history.length === 0 ? (
                        <Unavailable>No requests have been sent in this session.</Unavailable>
                    ) : (
                        <div className="space-y-2">
                            {history.map((item, index) => (
                                <button
                                    key={`${item.method}-${item.path}-${index}`}
                                    className="block w-full rounded border border-zinc-200 px-3 py-2 text-left text-sm dark:border-zinc-800"
                                    onClick={() => {
                                        form.setValue('method', item.method);
                                        form.setValue('path', item.path);
                                    }}
                                >
                                    {item.method} {item.path}
                                </button>
                            ))}
                        </div>
                    )}
                </Panel>
            </div>
        </div>
    );
}

function parsePairs(value: unknown): Record<string, string> {
    if (!value) return {};
    if (typeof value === 'object') return value as Record<string, string>;
    try {
        return JSON.parse(String(value)) as Record<string, string>;
    } catch {
        return {};
    }
}

function safeJson(value: string) {
    try {
        return JSON.parse(value) as unknown;
    } catch {
        return { text: value };
    }
}

function LogsExplorer({ data }: { data: DeveloperWorkspaceSnapshot }) {
    const [logs, setLogs] = useState<string[]>([]);
    const terminalRef = useRef<HTMLDivElement | null>(null);
    const termRef = useRef<Terminal | null>(null);

    useEffect(() => {
        const terminal = new Terminal({
            disableStdin: true,
            fontSize: 12,
            rows: 10,
            theme: { background: '#09090b' },
        });
        if (terminalRef.current) terminal.open(terminalRef.current);
        termRef.current = terminal;
        const original = {
            log: console.log,
            warn: console.warn,
            error: console.error,
        };
        function append(level: string, args: unknown[]) {
            const line = `${new Date().toISOString()} ${level} ${args.map(String).join(' ')}`;
            setLogs((current) => [line, ...current].slice(0, 200));
            terminal.writeln(line);
        }
        console.log = (...args) => {
            original.log(...args);
            append('log', args);
        };
        console.warn = (...args) => {
            original.warn(...args);
            append('warn', args);
        };
        console.error = (...args) => {
            original.error(...args);
            append('error', args);
        };
        return () => {
            console.log = original.log;
            console.warn = original.warn;
            console.error = original.error;
            terminal.dispose();
        };
    }, []);

    return (
        <div className="space-y-4">
            <Panel title="Log Sources">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {data.logs.map((source) => (
                        <div key={source.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium">{source.label}</p>
                                <StatusBadge status={source.status} />
                            </div>
                            <p className="mt-2 text-xs text-zinc-500">{source.detail}</p>
                        </div>
                    ))}
                </div>
            </Panel>
            <Panel title="Browser Console Stream">
                <div ref={terminalRef} className="overflow-hidden rounded bg-zinc-950 p-2" />
                {logs.length === 0 && (
                    <p className="mt-3 text-sm text-zinc-500">
                        No console events captured since opening this page.
                    </p>
                )}
            </Panel>
        </div>
    );
}

function QueueAndCron({ data, mode }: { data: DeveloperWorkspaceSnapshot; mode: 'cron' | 'queues' }) {
    if (mode === 'cron') {
        return (
            <Panel title="Cron + Job Registry">
                <div className="space-y-2">
                    {data.cronJobs.map((job) => (
                        <div key={job.id} className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                            <div className="flex items-center justify-between gap-3">
                                <span className="font-medium">{job.id}</span>
                                <StatusBadge status={job.status} />
                            </div>
                            <p className="mt-1 text-zinc-500">{job.source} {job.schedule ? `- ${job.schedule}` : ''}</p>
                            {job.detail && <p className="mt-2 text-zinc-600 dark:text-zinc-300">{job.detail}</p>}
                        </div>
                    ))}
                </div>
            </Panel>
        );
    }
    return (
        <Panel title="Queue + Worker Visibility">
            <div className="grid gap-3 md:grid-cols-2">
                {data.queues.map((queue) => (
                    <div key={queue.name} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                        <div className="flex items-center justify-between">
                            <p className="font-medium">{queue.name}</p>
                            <StatusBadge status={queue.status} />
                        </div>
                        {queue.counts ? (
                            <div className="mt-3 h-52">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={Object.entries(queue.counts).map(([name, value]) => ({ name, value }))}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" fontSize={11} />
                                        <YAxis allowDecimals={false} fontSize={11} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#2563eb" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <Unavailable>{queue.detail ?? 'Queue adapter unavailable.'}</Unavailable>
                        )}
                    </div>
                ))}
            </div>
        </Panel>
    );
}

function DockerPanel({ data }: { data: DeveloperWorkspaceSnapshot }) {
    return (
        <Panel title="Read-only Docker Visibility">
            {data.containers.length === 0 ? (
                <Unavailable>Docker socket is unavailable or no containers are visible to this process.</Unavailable>
            ) : (
                <div className="space-y-2">
                    {data.containers.map((container) => (
                        <div key={container.id} className="rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{container.name}</span>
                                <StatusBadge status={container.status} />
                            </div>
                            <p className="mt-1 text-zinc-500">{container.image}</p>
                            <p className="mt-1 text-zinc-500">{container.ports.join(', ') || 'No published ports'}</p>
                        </div>
                    ))}
                </div>
            )}
        </Panel>
    );
}

function SchemaExplorer({ data }: { data: DeveloperWorkspaceSnapshot }) {
    const nodes = data.schema.tables.slice(0, 60).map<Node>((table, index) => ({
        id: `${table.schema}.${table.name}`,
        data: { label: `${table.schema}.${table.name}` },
        position: { x: (index % 4) * 220, y: Math.floor(index / 4) * 90 },
    }));
    const edges = data.schema.tables.flatMap<Edge>((table) =>
        table.relationships.map((relationship, index) => ({
            id: [
                table.schema,
                table.name,
                relationship.column,
                relationship.referencesTable,
                relationship.referencesColumn,
                index,
            ].join('-'),
            source: `${table.schema}.${table.name}`,
            target: `public.${relationship.referencesTable}`,
        })),
    );
    const parentRef = useRef<HTMLDivElement | null>(null);
    const virtualizer = useVirtualizer({
        count: data.schema.tables.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 90,
    });

    return (
        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <Panel title="Tables">
                <div ref={parentRef} className="h-[560px] overflow-auto">
                    <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                        {virtualizer.getVirtualItems().map((item) => {
                            const table = data.schema.tables[item.index];
                            if (!table) return null;
                            return (
                                <div
                                    key={`${table.schema}.${table.name}`}
                                    className="absolute left-0 right-0 rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800"
                                    style={{ transform: `translateY(${item.start}px)` }}
                                >
                                    <p className="font-medium">{table.schema}.{table.name}</p>
                                    <p className="text-xs text-zinc-500">
                                        {table.columns.length} columns, {table.indexes.length} indexes, {table.policies.length} policies
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Panel>
            <Panel title="Relationship Graph">
                {nodes.length === 0 ? (
                    <Unavailable>{data.schema.detail ?? 'No schema metadata available.'}</Unavailable>
                ) : (
                    <div className="h-[560px] rounded border border-zinc-200 dark:border-zinc-800">
                        <ReactFlow nodes={nodes} edges={edges} fitView>
                            <Background />
                            <Controls />
                        </ReactFlow>
                    </div>
                )}
            </Panel>
        </div>
    );
}

function SimpleDiagnostics({ data, id }: { data: DeveloperWorkspaceSnapshot; id: SectionId }) {
    if (id === 'realtime') {
        return <Panel title="Realtime + WebSocket Diagnostics"><Unavailable>Supabase realtime client hooks were not found during this audit. Adapter boundary is present, but active subscription telemetry is not exported yet.</Unavailable></Panel>;
    }
    if (id === 'network') {
        return (
            <Panel title="Request + Network Diagnostics">
                <div className="grid gap-3 md:grid-cols-2">
                    {[data.requests.orchestrator, data.requests.deduplication].map((check) => (
                        <div key={check.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                            <div className="flex justify-between gap-3"><span>{check.label}</span><StatusBadge status={check.status} /></div>
                            <p className="mt-2 text-sm text-zinc-500">{check.detail}</p>
                        </div>
                    ))}
                </div>
            </Panel>
        );
    }
    if (id === 'metrics') {
        return <Panel title="Metrics + Resource Monitoring"><JsonView value={data.metrics} collapsed={2} /></Panel>;
    }
    if (id === 'integrations') {
        return (
            <Panel title="Integration Health">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {data.providers.map((provider) => (
                        <div key={provider.id} className="rounded border border-zinc-200 p-3 dark:border-zinc-800">
                            <div className="flex justify-between gap-3"><span>{provider.label}</span><StatusBadge status={provider.status} /></div>
                            <p className="mt-2 text-sm text-zinc-500">{provider.detail}</p>
                        </div>
                    ))}
                </div>
            </Panel>
        );
    }
    if (id === 'flags') {
        return <Panel title="Feature Flags">{data.featureFlags.length ? <JsonView value={data.featureFlags} collapsed={2} /> : <Unavailable>No feature flags are available through Supabase, or the feature_flags table is not reachable.</Unavailable>}</Panel>;
    }
    if (id === 'env') {
        return (
            <Panel title="Environment Validation">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {data.environment.map((item) => (
                        <div key={item.name} className="flex items-center justify-between rounded border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                            <span>{item.name}</span>
                            {item.configured && !item.malformed ? <CheckCircle2 className="text-emerald-500" size={16} /> : item.required ? <XCircle className="text-red-500" size={16} /> : <AlertTriangle className="text-zinc-400" size={16} />}
                        </div>
                    ))}
                </div>
            </Panel>
        );
    }
    if (id === 'errors') {
        return <Panel title="Error Tracking"><Unavailable>Sentry is instrumented. Issue ingestion requires a Sentry API adapter and SENTRY_AUTH_TOKEN; no issues are fabricated here.</Unavailable></Panel>;
    }
    return <Panel title="Storage + Upload Diagnostics"><Unavailable>Upload routes and Supabase/AWS storage clients exist, but no safe usage/failure telemetry endpoint is currently exported.</Unavailable></Panel>;
}

export function DeveloperPage() {
    const [active, setActive] = useState<SectionId>('overview');
    const query = useDeveloperWorkspace();
    const activeLabel = useMemo(
        () => nav.find(([id]) => id === active)?.[1] ?? 'Developer Workspace',
        [active],
    );

    return (
        <>
            <Header />
            <main className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50 md:px-6">
                <div className="mx-auto flex max-w-[1500px] gap-4">
                    <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-72 shrink-0 overflow-auto rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 lg:block">
                        <div className="mb-3 flex items-center gap-2 px-2 text-sm font-semibold">
                            <Wrench size={16} /> Developer Workspace
                        </div>
                        <nav className="space-y-1">
                            {nav.map(([id, label, Icon]) => (
                                <button
                                    key={id}
                                    onClick={() => setActive(id)}
                                    className={cn(
                                        'flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm',
                                        active === id
                                            ? 'bg-zinc-950 text-white dark:bg-zinc-50 dark:text-zinc-950'
                                            : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                                    )}
                                >
                                    <Icon size={16} /> {label}
                                </button>
                            ))}
                        </nav>
                    </aside>
                    <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold uppercase text-zinc-500">
                                    Internal developer platform
                                </p>
                                <h1 className="text-2xl font-semibold">
                                    {activeLabel}
                                </h1>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <Search size={14} />
                                {query.data ? `Updated ${new Date(query.data.generatedAt).toLocaleTimeString()}` : 'Loading'}
                            </div>
                        </div>
                        <div className="lg:hidden">
                            <select
                                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                                value={active}
                                onChange={(event) => setActive(event.target.value as SectionId)}
                            >
                                {nav.map(([id, label]) => (
                                    <option key={id} value={id}>{label}</option>
                                ))}
                            </select>
                        </div>
                        {query.isLoading && (
                            <Panel title="Loading">
                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                    <Loader2 className="animate-spin" size={16} />
                                    Loading real infrastructure adapters.
                                </div>
                            </Panel>
                        )}
                        {query.isError && (
                            <Panel title="Unavailable">
                                <Unavailable>{query.error.message}</Unavailable>
                            </Panel>
                        )}
                        {query.data && active === 'overview' && <Overview data={query.data} />}
                        {query.data && active === 'api' && <ApiTester data={query.data} />}
                        {query.data && active === 'logs' && <LogsExplorer data={query.data} />}
                        {query.data && active === 'cron' && <QueueAndCron data={query.data} mode="cron" />}
                        {query.data && active === 'queues' && <QueueAndCron data={query.data} mode="queues" />}
                        {query.data && active === 'docker' && <DockerPanel data={query.data} />}
                        {query.data && active === 'schema' && <SchemaExplorer data={query.data} />}
                        {query.data && ['realtime', 'network', 'metrics', 'integrations', 'flags', 'env', 'errors', 'storage'].includes(active) && (
                            <SimpleDiagnostics data={query.data} id={active} />
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}
