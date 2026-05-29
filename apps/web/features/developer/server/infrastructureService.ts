import type { DeveloperWorkspaceSnapshot } from '@/features/developer/schemas/infrastructureSchemas';
import { checkedAt } from './infraUtils';
import { discoverRoutes, getOverview } from './infraRoutes';
import { getEnvironment, getProviders } from './infraProviders';
import { getQueues, getCronJobs, getContainers } from './infraQueues';
import { getSchemaFromMigrations } from './infraSchema';
import {
    getMetrics,
    getLogSources,
    getFeatureFlags,
} from './infraObservability';

export async function getDeveloperWorkspaceSnapshot(
    userId?: string,
): Promise<DeveloperWorkspaceSnapshot> {
    const routes = await discoverRoutes();
    const [
        overview,
        providers,
        queues,
        cronJobs,
        containers,
        schema,
        metrics,
        featureFlags,
    ] = await Promise.all([
        getOverview(routes),
        getProviders(userId),
        getQueues(),
        getCronJobs(),
        getContainers(),
        getSchemaFromMigrations(),
        getMetrics(),
        getFeatureFlags(),
    ]);

    return {
        generatedAt: checkedAt(),
        overview,
        routes,
        environment: getEnvironment(),
        providers,
        queues,
        cronJobs,
        containers,
        schema,
        metrics,
        logs: getLogSources(),
        featureFlags,
        requests: {
            orchestrator: {
                id: 'request-orchestrator',
                label: 'Request orchestrator',
                status: 'healthy',
                source: 'lib/utils/requestOrchestration.ts',
                detail: 'Client-side queueing/concurrency boundary exists; live queue counters are not exported.',
                checkedAt: checkedAt(),
            },
            deduplication: {
                id: 'request-deduplication',
                label: 'Request deduplication',
                status: 'healthy',
                source: 'lib/utils/requestDeduplication.ts',
                detail: 'In-flight duplicate request sharing is available.',
                checkedAt: checkedAt(),
            },
            browserPerformanceAvailable: true,
        },
        audit: [
            'Existing integrations: Supabase, Sentry, BullMQ/Redis, ML FastAPI service, Stripe, Google/Microsoft auth, GitHub, Linear, AWS/S3, N8N, Prometheus metrics.',
            'Visibility gaps: no server log query endpoint, no ML log shipping endpoint, no Sentry issue adapter without SENTRY_AUTH_TOKEN, and no live request orchestrator counters.',
            'Unsafe patterns avoided: Docker is read-only, destructive API methods require confirmation, and secret env values are never returned.',
            'Schema explorer uses committed migrations as metadata source; production row browsing is intentionally not implemented.',
        ],
    };
}
