import { registry } from '@/lib/observability/metrics';
import { createAdminClient } from '@/lib/supabase/adminClient';
import type {
    FeatureFlag,
    LogSource,
} from '@/features/developer/schemas/infrastructureSchemas';
import { checkedAt, envConfigured } from './infraUtils';

export async function getMetrics() {
    const memory = process.memoryUsage();
    return {
        status: 'healthy' as const,
        source: 'prom-client registry and Node process',
        prometheusText: await registry.metrics(),
        process: {
            uptimeSeconds: Math.round(process.uptime()),
            memoryRssBytes: memory.rss,
            memoryHeapUsedBytes: memory.heapUsed,
            memoryHeapTotalBytes: memory.heapTotal,
        },
        checkedAt: checkedAt(),
    };
}

export function getLogSources(): LogSource[] {
    return [
        {
            id: 'structured-server',
            label: 'Server structured logs',
            status: 'healthy',
            source: 'lib/observability/logger.ts',
            detail: 'Pino structured logging is configured with token redaction.',
        },
        {
            id: 'browser-console',
            label: 'Browser console capture',
            status: 'healthy',
            source: 'Developer Workspace client runtime',
            detail: 'The page captures real console events generated after it loads.',
        },
        {
            id: 'ml-service',
            label: 'ML service logs',
            status: 'unavailable',
            source: 'ml_service/observability.py',
            detail: 'ML service emits JSON logs, but no log shipping endpoint is configured for the dashboard.',
            unavailableReason: 'endpoint_missing',
        },
        {
            id: 'sentry-events',
            label: 'Sentry issues',
            status: envConfigured('SENTRY_AUTH_TOKEN')
                ? 'healthy'
                : 'unavailable',
            source: 'Sentry API',
            detail: envConfigured('SENTRY_AUTH_TOKEN')
                ? 'Sentry API token is configured.'
                : 'SENTRY_AUTH_TOKEN is missing; issue API queries are gated.',
            ...(!envConfigured('SENTRY_AUTH_TOKEN')
                ? { unavailableReason: 'not_configured' as const }
                : {}),
        },
    ];
}

export async function getFeatureFlags(): Promise<FeatureFlag[]> {
    if (!envConfigured('SUPABASE_SERVICE_ROLE_KEY')) return [];
    try {
        const admin = createAdminClient();
        const { data, error } = await admin
            .from('feature_flags')
            .select('id, key, description, enabled, rollout_pct, updated_at')
            .order('key');
        if (error) return [];
        return (data ?? []) as FeatureFlag[];
    } catch {
        return [];
    }
}
