'use client';

import '@xyflow/react/dist/style.css';
import '@xterm/xterm/css/xterm.css';

import { useMemo, useState } from 'react';
import {
    Loader2,
    Search,
    Wrench,
    Server,
    Globe2,
    Braces,
    Clock3,
    Boxes,
    Container,
    Database,
    RadioTower,
    Network,
    Gauge,
    PlugZap,
    Flag,
    KeyRound,
    ShieldAlert,
    UploadCloud,
} from 'lucide-react';
import Header from '@/features/ui/components/Header';
import { useDeveloperWorkspace } from '@/features/developer/hooks/useDeveloperWorkspace';
import { cn } from '@/lib/utils/utils';
import {
    Panel,
    Unavailable,
    type SectionId,
} from '@/features/developer/components/DevShared';
import { DevOverview } from '@/features/developer/components/DevOverview';
import { DevApiTester } from '@/features/developer/components/DevApiTester';
import { DevLogsExplorer } from '@/features/developer/components/DevLogsExplorer';
import { DevQueueAndCron } from '@/features/developer/components/DevQueueAndCron';
import { DevDockerPanel } from '@/features/developer/components/DevDockerPanel';
import { DevSchemaExplorer } from '@/features/developer/components/DevSchemaExplorer';
import { DevSimpleDiagnostics } from '@/features/developer/components/DevSimpleDiagnostics';

const SIMPLE_DIAGNOSTICS_IDS: SectionId[] = [
    'realtime',
    'network',
    'metrics',
    'integrations',
    'flags',
    'env',
    'errors',
    'storage',
];

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
                                {query.data
                                    ? `Updated ${new Date(query.data.generatedAt).toLocaleTimeString()}`
                                    : 'Loading'}
                            </div>
                        </div>
                        <div className="lg:hidden">
                            <select
                                className="w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                                value={active}
                                onChange={(e) =>
                                    setActive(e.target.value as SectionId)
                                }
                            >
                                {nav.map(([id, label]) => (
                                    <option key={id} value={id}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {query.isLoading && (
                            <Panel title="Loading">
                                <div className="flex items-center gap-2 text-sm text-zinc-500">
                                    <Loader2
                                        className="animate-spin"
                                        size={16}
                                    />{' '}
                                    Loading real infrastructure adapters.
                                </div>
                            </Panel>
                        )}
                        {query.isError && (
                            <Panel title="Unavailable">
                                <Unavailable>{query.error.message}</Unavailable>
                            </Panel>
                        )}
                        {query.data && active === 'overview' && (
                            <DevOverview data={query.data} />
                        )}
                        {query.data && active === 'api' && (
                            <DevApiTester data={query.data} />
                        )}
                        {query.data && active === 'logs' && (
                            <DevLogsExplorer data={query.data} />
                        )}
                        {query.data && active === 'cron' && (
                            <DevQueueAndCron data={query.data} mode="cron" />
                        )}
                        {query.data && active === 'queues' && (
                            <DevQueueAndCron data={query.data} mode="queues" />
                        )}
                        {query.data && active === 'docker' && (
                            <DevDockerPanel data={query.data} />
                        )}
                        {query.data && active === 'schema' && (
                            <DevSchemaExplorer data={query.data} />
                        )}
                        {query.data &&
                            SIMPLE_DIAGNOSTICS_IDS.includes(active) && (
                                <DevSimpleDiagnostics
                                    data={query.data}
                                    id={active}
                                />
                            )}
                    </div>
                </div>
            </main>
        </>
    );
}
