'use client';

import { apiRouteFetch } from '@/lib/api/client';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import JsonView from '@uiw/react-json-view';
import dynamic from 'next/dynamic';
import { Globe2, Loader2 } from 'lucide-react';
import {
    apiTesterRequestSchema,
    type ApiTesterRequestInput,
    type ApiTesterRequest,
    type ApiTesterResponse,
} from '@/features/developer/schemas/infrastructureSchemas';
import {
    Panel,
    Unavailable,
    type DeveloperWorkspaceSnapshot,
} from './DevShared';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
});

function parsePairs(value: unknown): Record<string, string> {
    if (!value) return {};
    if (typeof value === 'object') return value as Record<string, string>;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) as Record<string, string>;
        } catch {
            return {};
        }
    }
    return {};
}

function safeJson(value: string): object {
    try {
        const parsed = JSON.parse(value) as unknown;
        return parsed !== null && typeof parsed === 'object'
            ? parsed
            : { value: parsed };
    } catch {
        return { text: value };
    }
}

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

export function DevApiTester({ data }: { data: DeveloperWorkspaceSnapshot }) {
    const [response, setResponse] = useState<ApiTesterResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState<ApiTesterRequest[]>([]);
    const [body, setBody] = useState('{\n  \n}');
    const [queryText, setQueryText] = useState('');
    const [headerText, setHeaderText] = useState('');
    const form = useForm<ApiTesterRequestInput, undefined, ApiTesterRequest>({
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
    const selectedMethod = useWatch({ control: form.control, name: 'method' });
    const selectedPath = useWatch({ control: form.control, name: 'path' });

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
            const res = await apiRouteFetch('/api/developer/api-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            const json = (await res.json()) as { error?: string };
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
        ? `curl -X ${selectedMethod} '${selectedPath}'`
        : 'Run a request to generate cURL.';

    return (
        <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
            <Panel title="Request Builder">
                <form
                    className="space-y-3"
                    onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
                >
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                        <select
                            className="rounded border border-zinc-300 bg-white px-2 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                            {...form.register('method')}
                        >
                            {methods.map((m) => (
                                <option key={m}>{m}</option>
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
                            onChange={(e) => setQueryText(e.target.value)}
                        />
                    </label>
                    <label className="block text-xs font-medium text-zinc-500">
                        Headers JSON
                        <textarea
                            className="mt-1 h-16 w-full rounded border border-zinc-300 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
                            placeholder='{"x-request-id":"dev-test"}'
                            value={headerText}
                            onChange={(e) => setHeaderText(e.target.value)}
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
                                    onChange={(v) => setBody(v ?? '')}
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
                        {loading ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <Globe2 size={16} />
                        )}
                        Send request
                    </button>
                </form>
            </Panel>
            <div className="space-y-4">
                <Panel title="Response Inspector">
                    {error && <Unavailable>{error}</Unavailable>}
                    {!error && !response && (
                        <Unavailable>
                            Run a real internal API request to inspect its
                            response.
                        </Unavailable>
                    )}
                    {response && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-2 text-sm">
                                <span>
                                    {response.status} {response.statusText}
                                </span>
                                <span>{response.durationMs} ms</span>
                                <span>
                                    {response.contentType ??
                                        'unknown content type'}
                                </span>
                            </div>
                            <JsonView
                                value={safeJson(response.bodyText)}
                                collapsed={2}
                            />
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
                        <Unavailable>
                            No requests have been sent in this session.
                        </Unavailable>
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
