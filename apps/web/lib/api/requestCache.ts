type CacheEntry = {
    expiresAt: number;
    value: unknown;
};

const responseCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();
const NEGATIVE_CACHE_TTL_MS = 30_000;

function fallbackForMissingRoute(url: string): unknown {
    const path = url.split('?')[0] ?? url;
    switch (path) {
        case '/api/command/workstreams':
        case '/api/collaboration/workspaces':
        case '/api/collaboration/handoffs':
        case '/api/creative/projects':
        case '/api/memory/decks':
        case '/api/memory/cards':
        case '/api/memory/routines':
            return [];
        case '/api/chat/conversations':
            return { conversations: [] };
        case '/api/chat/model-keys':
            return { providers: [], availability: [] };
        case '/api/context/entries':
            return { entries: [] };
        default:
            return undefined;
    }
}

function hasMissingRouteFallback(url: string): boolean {
    return fallbackForMissingRoute(url) !== undefined;
}

export async function cachedJson<T>(
    url: string,
    options: { ttlMs?: number } = {},
): Promise<T> {
    const ttlMs = options.ttlMs ?? 10_000;
    const cached = responseCache.get(url);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;

    const existing = inflight.get(url);
    const promise =
        existing ??
        fetch(url).then(async (res) => {
            if (!res.ok) {
                const fallback =
                    res.status === 404 ||
                    res.status === 500 ||
                    res.status === 503
                        ? fallbackForMissingRoute(url)
                        : undefined;
                if (fallback !== undefined) return fallback as T;
                throw new Error(`Failed to fetch ${url}`);
            }
            return (await res.json()) as T;
        });

    if (!existing) inflight.set(url, promise);
    try {
        const value = (await promise) as T;
        const expiresIn = hasMissingRouteFallback(url)
            ? NEGATIVE_CACHE_TTL_MS
            : ttlMs;
        responseCache.set(url, { value, expiresAt: Date.now() + expiresIn });
        return value;
    } finally {
        if (!existing) inflight.delete(url);
    }
}

export function clearCachedJson(prefix?: string) {
    if (!prefix) {
        responseCache.clear();
        return;
    }
    for (const key of responseCache.keys()) {
        if (key.startsWith(prefix)) responseCache.delete(key);
    }
}
