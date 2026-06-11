import type { DataResolver } from '@/features/widgets/types/snapshot';

type ResolverModule = Record<string, unknown>;
type ResolverLoader = () => Promise<ResolverModule>;

const resolverKeys = [
    'finance.summary',
    'currency.rates.usd',
    'workflows.recent',
    'inbox.messages',
    'calendar.events',
    'developer.activity',
    'datahealth.system',
    'files.recent',
    'tracking.today',
    'recovery.trackers',
    'tasks.open',
    'weather.current',
    'events.feed.ranked',
    'activity.recent',
] as const;

const resolverLoaders: Record<(typeof resolverKeys)[number], ResolverLoader> = {
    'finance.summary': () =>
        import('@/features/finance/server/financeResolvers'),
    'currency.rates.usd': () =>
        import('@/features/currency/server/currencyResolvers'),
    'workflows.recent': () =>
        import('@/features/workflows/server/workflowResolvers'),
    'inbox.messages': () => import('@/features/inbox/server/inboxResolvers'),
    'calendar.events': () =>
        import('@/features/calendar/server/calendarResolvers'),
    'developer.activity': () =>
        import('@/features/developer/server/developerResolvers'),
    'datahealth.system': () =>
        import('@/features/developer/server/developerResolvers'),
    'files.recent': () => import('@/features/uploads/server/filesResolvers'),
    'tracking.today': () =>
        import('@/features/tracking/server/trackingResolvers'),
    'recovery.trackers': () =>
        import('@/features/recovery/server/recoveryResolvers'),
    'tasks.open': () => import('@/features/todo/server/todoResolvers'),
    'weather.current': () =>
        import('@/features/weather/server/weatherResolvers'),
    'events.feed.ranked': () => import('@/features/news/server/newsResolvers'),
    'activity.recent': () =>
        import('@/features/activity/server/activityResolvers'),
};

const resolverCache = new Map<string, DataResolver>();

function resolversFromModule(module: ResolverModule): DataResolver[] {
    const resolvers: DataResolver[] = [];
    for (const value of Object.values(module)) {
        if (!Array.isArray(value)) continue;
        resolvers.push(...value.filter(isDataResolver));
    }
    return resolvers;
}

function isDataResolver(value: unknown): value is DataResolver {
    return Boolean(
        value &&
        typeof value === 'object' &&
        'key' in value &&
        'resolve' in value,
    );
}

export async function getDataResolver(
    key: string,
): Promise<DataResolver | undefined> {
    const cached = resolverCache.get(key);
    if (cached) return cached;

    const loader = resolverLoaders[key as keyof typeof resolverLoaders];
    if (!loader) return undefined;

    const resolverModule = await loader();
    for (const resolver of resolversFromModule(resolverModule)) {
        resolverCache.set(resolver.key, resolver);
    }
    return resolverCache.get(key);
}

export function listDataResolvers(): DataResolver[] {
    return resolverKeys.map((key) => ({
        key,
        resolve: () => Promise.resolve(undefined),
    }));
}
