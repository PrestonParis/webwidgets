import { getDeveloperSnapshot } from '@/features/developer/server/developerService';
import type {
    EnvironmentVariable,
    ProviderHealth,
} from '@/features/developer/schemas/infrastructureSchemas';
import { checkedAt, envCheck, envConfigured } from './infraUtils';

export function getEnvironment(): EnvironmentVariable[] {
    return [
        envCheck('NEXT_PUBLIC_SUPABASE_URL', true, 'public', 'supabase'),
        envCheck('NEXT_PUBLIC_SUPABASE_ANON_KEY', true, 'public', 'supabase'),
        envCheck('SUPABASE_SERVICE_ROLE_KEY', true, 'secret', 'supabase'),
        envCheck('ML_SERVICE_URL', false, 'server', 'ml_service'),
        envCheck('REDIS_URL', false, 'secret', 'queues'),
        envCheck('SENTRY_DSN', false, 'secret', 'sentry'),
        envCheck('METRICS_SECRET', false, 'secret', 'metrics'),
        envCheck('STRIPE_SECRET_KEY', false, 'secret', 'stripe'),
        envCheck('STRIPE_WEBHOOK_SECRET', false, 'secret', 'stripe'),
        envCheck('OPENAI_API_KEY', false, 'secret', 'openai'),
        envCheck('GOOGLE_CLIENT_ID', false, 'server', 'google'),
        envCheck('GOOGLE_CLIENT_SECRET', false, 'secret', 'google'),
        envCheck('AWS_S3_BUCKET', false, 'server', 'storage'),
        envCheck('AWS_ACCESS_KEY_ID', false, 'secret', 'storage'),
        envCheck('AWS_SECRET_ACCESS_KEY', false, 'secret', 'storage'),
        envCheck('GITHUB_TOKEN', false, 'secret', 'github'),
        envCheck('LINEAR_API_KEY', false, 'secret', 'linear'),
    ];
}

export async function getProviders(userId?: string): Promise<ProviderHealth[]> {
    const now = checkedAt();
    const developer = await getDeveloperSnapshot(userId).catch(() => ({
        connectedProviders: [] as string[],
    }));
    const connected = new Set(developer.connectedProviders);
    const cfg = (name: string) => envConfigured(name);

    return [
        {
            id: 'github',
            label: 'GitHub',
            status:
                connected.has('github') || cfg('GITHUB_TOKEN')
                    ? 'healthy'
                    : 'unavailable',
            authState:
                connected.has('github') || cfg('GITHUB_TOKEN')
                    ? 'connected'
                    : 'not_configured',
            detail: connected.has('github')
                ? 'User integration token resolved.'
                : cfg('GITHUB_TOKEN')
                  ? 'Server token configured.'
                  : 'No GitHub token resolved.',
            checkedAt: now,
        },
        {
            id: 'linear',
            label: 'Linear',
            status:
                connected.has('linear') || cfg('LINEAR_API_KEY')
                    ? 'healthy'
                    : 'unavailable',
            authState:
                connected.has('linear') || cfg('LINEAR_API_KEY')
                    ? 'connected'
                    : 'not_configured',
            detail: connected.has('linear')
                ? 'User integration token resolved.'
                : cfg('LINEAR_API_KEY')
                  ? 'Server token configured.'
                  : 'No Linear token resolved.',
            checkedAt: now,
        },
        {
            id: 'stripe',
            label: 'Stripe',
            status: cfg('STRIPE_SECRET_KEY') ? 'healthy' : 'unavailable',
            authState: cfg('STRIPE_SECRET_KEY')
                ? 'connected'
                : 'not_configured',
            detail: cfg('STRIPE_SECRET_KEY')
                ? 'Stripe secret key is configured.'
                : 'Stripe secret key is missing.',
            checkedAt: now,
        },
        {
            id: 'openai',
            label: 'OpenAI',
            status: cfg('OPENAI_API_KEY') ? 'healthy' : 'unavailable',
            authState: cfg('OPENAI_API_KEY') ? 'connected' : 'not_configured',
            detail: cfg('OPENAI_API_KEY')
                ? 'OpenAI API key is configured.'
                : 'OpenAI API key is missing.',
            checkedAt: now,
        },
        {
            id: 'google',
            label: 'Google APIs',
            status:
                cfg('GOOGLE_CLIENT_ID') && cfg('GOOGLE_CLIENT_SECRET')
                    ? 'healthy'
                    : 'unavailable',
            authState:
                cfg('GOOGLE_CLIENT_ID') && cfg('GOOGLE_CLIENT_SECRET')
                    ? 'connected'
                    : 'not_configured',
            detail: 'OAuth readiness is derived from server env configuration; token freshness is provider-specific.',
            checkedAt: now,
        },
    ];
}
