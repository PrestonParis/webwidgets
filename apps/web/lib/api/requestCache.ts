type CacheEntry = {
    expiresAt: number;
    value: unknown;
};

const responseCache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

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
            if (!res.ok) throw new Error(`Failed to fetch ${url}`);
            return (await res.json()) as T;
        });

    if (!existing) inflight.set(url, promise);
    try {
        const value = (await promise) as T;
        responseCache.set(url, { value, expiresAt: Date.now() + ttlMs });
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
