'use client';

import {
    clearResourceFailure,
    isInCooldown,
    markResourceFailure,
    markResourceSuccess,
} from './widgetFailureRegistry';

type Fetcher<T> = (signal: AbortSignal) => Promise<T>;

type ResourceOptions<T> = {
    key: string;
    widgetId: string;
    fetcher: Fetcher<T>;
    ttlMs?: number;
    timeoutMs?: number;
    cooldownKey?: string;
};

type CacheEntry = {
    expiresAt: number;
    value: unknown;
};

type QueueTask<T> = {
    run: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: unknown) => void;
};

const DEFAULT_TTL_MS = 15_000;
const DEFAULT_TIMEOUT_MS = 8_000;
const MAX_ACTIVE_FETCHES = 5;
const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();
const queue: QueueTask<unknown>[] = [];
let activeFetchCount = 0;
let fetchCountListener: ((count: number) => void) | null = null;

function emitFetchCount() {
    fetchCountListener?.(activeFetchCount);
}

export function subscribeWidgetFetchCount(
    listener: (count: number) => void,
): () => void {
    fetchCountListener = listener;
    listener(activeFetchCount);
    return () => {
        if (fetchCountListener === listener) fetchCountListener = null;
    };
}

function runNext() {
    if (activeFetchCount >= MAX_ACTIVE_FETCHES) return;
    const task = queue.shift();
    if (!task) return;
    activeFetchCount += 1;
    emitFetchCount();
    task.run()
        .then(task.resolve)
        .catch(task.reject)
        .finally(() => {
            activeFetchCount = Math.max(0, activeFetchCount - 1);
            emitFetchCount();
            runNext();
        });
}

function enqueue<T>(run: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        queue.push({
            run: run as () => Promise<unknown>,
            resolve: resolve as (value: unknown) => void,
            reject,
        });
        runNext();
    });
}

function timeoutSignal(timeoutMs: number): AbortSignal {
    const controller = new AbortController();
    window.setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
}

function shouldCooldownStatus(status: number): boolean {
    return status === 408 || status === 429 || status === 500 || status === 503;
}

function normalizeApiKey(input: RequestInfo | URL): string | null {
    const raw =
        typeof input === 'string'
            ? input
            : input instanceof URL
              ? input.toString()
              : input.url;
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (!url.pathname.startsWith('/api/')) return null;
    return `${url.pathname}${url.search}`;
}

function cooldownResponse(key: string): Response {
    const body = JSON.stringify({
        error: 'temporarily unavailable',
        dashboardRuntimeCooldown: true,
        key,
    });
    return new Response(body, {
        status: 503,
        headers: { 'content-type': 'application/json' },
    });
}

export async function getWidgetResource<T>({
    key,
    widgetId,
    fetcher,
    ttlMs = DEFAULT_TTL_MS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    cooldownKey = key,
}: ResourceOptions<T>): Promise<T> {
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
    if (isInCooldown(cooldownKey)) {
        throw new Error(`Dashboard resource is cooling down: ${cooldownKey}`);
    }

    const existing = inflight.get(key);
    if (existing) {
        if (process.env.NODE_ENV !== 'production') {
            console.info('[dashboard-runtime] fetch deduped', {
                key,
                widgetId,
            });
        }
        return existing as Promise<T>;
    }

    const promise = enqueue(async () => {
        const signal = timeoutSignal(timeoutMs);
        try {
            const value = await fetcher(signal);
            cache.set(key, { value, expiresAt: Date.now() + ttlMs });
            markResourceSuccess(cooldownKey);
            return value;
        } catch (error) {
            markResourceFailure(cooldownKey, {
                message:
                    error instanceof Error ? error.message : 'Request failed',
                resourceKey: key,
            });
            throw error;
        }
    });
    inflight.set(key, promise);
    try {
        return await promise;
    } finally {
        inflight.delete(key);
    }
}

export function installDashboardFetchGuard(): () => void {
    if (typeof window === 'undefined') return () => undefined;
    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input, init) => {
        const method = (init?.method ?? 'GET').toUpperCase();
        const key = method === 'GET' ? normalizeApiKey(input) : null;
        if (!key) return originalFetch(input, init);

        const cooldownKey = key.split('?')[0] ?? key;
        if (isInCooldown(cooldownKey)) {
            if (process.env.NODE_ENV !== 'production') {
                console.info('[dashboard-runtime] fetch denied by cooldown', {
                    key,
                    cooldownKey,
                });
            }
            return cooldownResponse(cooldownKey);
        }

        try {
            const response = await getWidgetResource<Response>({
                key,
                widgetId: 'dashboard-runtime',
                ttlMs: 10_000,
                timeoutMs: 8_000,
                cooldownKey,
                fetcher: async (signal) => {
                    const nextInit: RequestInit = { ...init, signal };
                    const res = await originalFetch(input, nextInit);
                    if (shouldCooldownStatus(res.status)) {
                        throw new Error(`API ${res.status}: ${key}`);
                    }
                    return res;
                },
            });
            clearResourceFailure(cooldownKey);
            return response.clone();
        } catch (error) {
            return cooldownResponse(cooldownKey);
        }
    };

    return () => {
        window.fetch = originalFetch;
    };
}

export function clearWidgetResourceCache(prefix?: string) {
    if (!prefix) {
        cache.clear();
        return;
    }
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) cache.delete(key);
    }
}
