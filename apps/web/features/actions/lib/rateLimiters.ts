import Bottleneck from 'bottleneck';
import { getLogger } from '@/lib/observability/logger';

const limiters = new Map<string, Bottleneck>();

export function getActionProviderLimiter(userId: string, providerId: string) {
    const key = `${userId}:${providerId}`;
    const existing = limiters.get(key);
    if (existing) return existing;

    const limiter = new Bottleneck({
        id: `action-provider-${key}`,
        maxConcurrent: 2,
        minTime: 500,
    });
    const log = getLogger({
        component: 'action-provider-limiter',
        providerId,
        userId,
    });
    limiter.on('failed', (error) =>
        log.warn({ err: error }, 'provider limiter failure'),
    );
    limiter.on('dropped', (dropped) =>
        log.warn({ dropped }, 'provider limiter dropped request'),
    );
    limiters.set(key, limiter);
    return limiter;
}
