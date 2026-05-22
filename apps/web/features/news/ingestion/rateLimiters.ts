import Bottleneck from 'bottleneck';
import { getLogger } from '@/lib/observability/logger';

const limiters = new Map<string, Bottleneck>();

export function getProviderLimiter(providerId: string) {
    const existing = limiters.get(providerId);
    if (existing) return existing;

    const limiter = new Bottleneck({
        id: `news-provider-${providerId}`,
        maxConcurrent: 2,
        minTime: 750,
    });
    const log = getLogger({ component: 'news-rate-limiter', providerId });
    limiter.on('dropped', (dropped) => {
        log.warn({ dropped }, 'provider rate limiter dropped job');
    });
    limiter.on('failed', (error) => {
        log.warn({ err: error }, 'provider rate limiter failure');
    });
    limiters.set(providerId, limiter);
    return limiter;
}
