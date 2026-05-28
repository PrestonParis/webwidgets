'use client';

import { useState, useEffect, useRef } from 'react';
import { Terminal } from '@xterm/xterm';
import {
    StatusBadge,
    Panel,
    type DeveloperWorkspaceSnapshot,
} from './DevShared';

export function DevLogsExplorer({
    data,
}: {
    data: DeveloperWorkspaceSnapshot;
}) {
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
                        <div
                            key={source.id}
                            className="rounded border border-zinc-200 p-3 dark:border-zinc-800"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium">
                                    {source.label}
                                </p>
                                <StatusBadge status={source.status} />
                            </div>
                            <p className="mt-2 text-xs text-zinc-500">
                                {source.detail}
                            </p>
                        </div>
                    ))}
                </div>
            </Panel>
            <Panel title="Browser Console Stream">
                <div
                    ref={terminalRef}
                    className="overflow-hidden rounded bg-zinc-950 p-2"
                />
                {logs.length === 0 && (
                    <p className="mt-3 text-sm text-zinc-500">
                        No console events captured since opening this page.
                    </p>
                )}
            </Panel>
        </div>
    );
}
