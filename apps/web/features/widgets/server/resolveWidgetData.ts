import { captureError } from '@/lib/observability/sentry';
import { getDataResolver } from '@/features/widgets/registry/widgetDataRegistry';
import type {
    ResolvedData,
    ResolverContext,
} from '@/features/widgets/types/snapshot';

const RESOLVER_TIMEOUT_MS = 6000;
const RESOLVER_CACHE_TTL_MS = 15_000;

const dataCache = new Map<
    string,
    { expiresAt: number; value: ResolvedData | Promise<ResolvedData> }
>();

function clientMessageFor(key: string): string {
    const feature = key.split('.')[0] ?? 'Widget';
    return `${feature[0]?.toUpperCase() ?? 'W'}${feature.slice(1)} data is temporarily unavailable.`;
}

function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    label: string,
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(
                () =>
                    reject(
                        new Error(`Resolver timed out after ${ms}ms: ${label}`),
                    ),
                ms,
            ),
        ),
    ]);
}

function getCacheExpiry(resolver: {
    cachePolicy?: { ttlSeconds?: number };
}): number {
    return (
        Date.now() +
        (resolver.cachePolicy?.ttlSeconds
            ? resolver.cachePolicy.ttlSeconds * 1000
            : RESOLVER_CACHE_TTL_MS)
    );
}

function buildRejectedResult(
    key: string,
    code: string,
    startedAt: number,
): ResolvedData {
    return {
        key,
        status: 'rejected',
        error: {
            code,
            message: clientMessageFor(key),
        },
        durationMs: Math.round(performance.now() - startedAt),
    };
}

function captureResolverError(
    err: unknown,
    ctx: ResolverContext,
    key: string,
    durationMs: number,
): void {
    captureError(err, {
        ...(ctx.userId !== undefined && { userId: ctx.userId }),
        ...(ctx.requestId !== undefined && { requestId: ctx.requestId }),
        operation: 'resolveWidgetData',
        ...(key.split('.')[0] !== undefined && { feature: key.split('.')[0] }),
        tags: {
            resolverKey: key,
            screen: ctx.screen,
            fallbackUsed: 'false',
        },
        extra: { durationMs },
    });
}

async function resolveSingleKey(
    key: string,
    ctx: ResolverContext,
): Promise<ResolvedData> {
    const startedAt = performance.now();
    const cacheKey = `${ctx.screen}:${ctx.userId ?? 'anon'}:${key}`;
    const cached = dataCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
    }

    const resolver = await getDataResolver(key);
    if (!resolver) {
        return buildRejectedResult(key, 'RESOLVER_NOT_FOUND', startedAt);
    }

    const resolvePromise = (async (): Promise<ResolvedData> => {
        const output = await withTimeout(
            resolver.resolve(ctx),
            RESOLVER_TIMEOUT_MS,
            key,
        );
        const data = resolver.schema ? resolver.schema.parse(output) : output;
        return {
            key,
            status: 'fulfilled',
            data,
            durationMs: Math.round(performance.now() - startedAt),
        };
    })();

    dataCache.set(cacheKey, {
        value: resolvePromise,
        expiresAt: getCacheExpiry(resolver),
    });

    try {
        const result = await resolvePromise;
        dataCache.set(cacheKey, {
            value: result,
            expiresAt: getCacheExpiry(resolver),
        });
        return result;
    } catch (err) {
        dataCache.delete(cacheKey);
        const durationMs = Math.round(performance.now() - startedAt);
        captureResolverError(err, ctx, key, durationMs);
        return buildRejectedResult(key, 'RESOLVER_FAILED', startedAt);
    }
}

export async function resolveWidgetData(
    dataNeeds: string[],
    ctx: ResolverContext,
): Promise<Record<string, ResolvedData>> {
    const uniqueNeeds = [...new Set(dataNeeds)];
    const settled = await Promise.allSettled(
        uniqueNeeds.map((key) => resolveSingleKey(key, ctx)),
    );

    const entries = settled.map((result, index): ResolvedData => {
        if (result.status === 'fulfilled') return result.value;
        const key = uniqueNeeds[index] ?? 'unknown';
        captureError(result.reason, {
            ...(ctx.userId !== undefined && { userId: ctx.userId }),
            ...(ctx.requestId !== undefined && { requestId: ctx.requestId }),
            operation: 'resolveWidgetData.settled',
            ...(key.split('.')[0] !== undefined && {
                feature: key.split('.')[0],
            }),
            tags: { resolverKey: key, screen: ctx.screen },
        });
        return {
            key,
            status: 'rejected',
            error: { code: 'RESOLVER_FAILED', message: clientMessageFor(key) },
            durationMs: 0,
        };
    });

    return Object.fromEntries(entries.map((entry) => [entry.key, entry]));
}
