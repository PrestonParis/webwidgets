import fs from 'node:fs/promises';
import path from 'node:path';
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import Docker from 'dockerode';
import { registry } from '@/lib/observability/metrics';
import { checkMlService, checkSupabaseRest } from '@/lib/connectors/serviceHealth';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { getDeveloperSnapshot } from '@/features/developer/server/developerService';
import type {
    ContainerSnapshot,
    CronJobDefinition,
    DeveloperWorkspaceSnapshot,
    DiagnosticCheck,
    DiagnosticStatus,
    EnvironmentVariable,
    FeatureFlag,
    LogSource,
    ProviderHealth,
    QueueSnapshot,
    RouteDefinition,
    SchemaSnapshot,
    SchemaTable,
} from '@/features/developer/schemas/infrastructureSchemas';

const root = process.cwd();
const checkedAt = () => new Date().toISOString();

function statusFromOk(ok: boolean): DiagnosticStatus {
    return ok ? 'healthy' : 'unhealthy';
}

function envConfigured(name: string) {
    return Boolean(process.env[name]?.trim());
}

function envCheck(
    name: string,
    required: boolean,
    scope: EnvironmentVariable['scope'],
    provider?: string,
): EnvironmentVariable {
    const configured = envConfigured(name);
    const value = process.env[name];
    const malformed =
        configured &&
        ((name.endsWith('_URL') && value !== undefined && !/^https?:\/\//.test(value)) ||
            (name.includes('PERCENT') &&
                value !== undefined &&
                Number.isNaN(Number(value))));

    return {
        name,
        required,
        configured,
        malformed,
        scope,
        ...(provider ? { provider } : {}),
    };
}

async function pathExists(filePath: string) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function discoverRoutes(): Promise<RouteDefinition[]> {
    const apiRoot = path.join(root, 'app', 'api');
    const routes: RouteDefinition[] = [];

    async function walk(dir: string) {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(fullPath);
                continue;
            }
            if (entry.name !== 'route.ts' && entry.name !== 'route.tsx') continue;
            const source = await fs.readFile(fullPath, 'utf8');
            const methods = [...source.matchAll(/export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)]
                .map((match) => match[1])
                .filter((method): method is string => Boolean(method));
            const rel = path.relative(apiRoot, path.dirname(fullPath));
            routes.push({
                path: `/api/${rel.replaceAll(path.sep, '/')}`,
                methods: methods.length ? methods : ['GET'],
                file: path.relative(root, fullPath),
            });
        }
    }

    if (await pathExists(apiRoot)) await walk(apiRoot);
    return routes.sort((a, b) => a.path.localeCompare(b.path));
}

async function getOverview(routes: RouteDefinition[]): Promise<DiagnosticCheck[]> {
    const now = checkedAt();
    const [supabaseRest, ml] = await Promise.all([
        checkSupabaseRest(),
        checkMlService(),
    ]);

    const checks: DiagnosticCheck[] = [
        {
            id: 'next-api',
            label: 'Next.js route handlers',
            status: routes.length > 0 ? 'healthy' : 'unavailable',
            source: 'app/api route discovery',
            detail: `${routes.length} route handlers discovered from app/api`,
            checkedAt: now,
        },
        supabaseRest
            ? {
                  id: 'supabase-rest',
                  label: 'Supabase REST',
                  status: statusFromOk(supabaseRest.status === 'ok'),
                  source: 'Supabase REST health probe',
                  latencyMs: supabaseRest.latencyMs,
                  checkedAt: now,
              }
            : {
                  id: 'supabase-rest',
                  label: 'Supabase REST',
                  status: 'unavailable',
                  source: 'environment',
                  detail: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.',
                  checkedAt: now,
                  unavailableReason: 'not_configured',
              },
        ml
            ? {
                  id: 'ml-service',
                  label: 'ML service',
                  status: statusFromOk(ml.status === 'ok'),
                  source: 'ML_SERVICE_URL',
                  latencyMs: ml.latencyMs,
                  checkedAt: now,
              }
            : {
                  id: 'ml-service',
                  label: 'ML service',
                  status: 'unavailable',
                  source: 'environment',
                  detail: 'ML_SERVICE_URL is not configured.',
                  checkedAt: now,
                  unavailableReason: 'not_configured',
              },
        {
            id: 'sentry',
            label: 'Sentry',
            status: envConfigured('SENTRY_DSN') ? 'healthy' : 'unavailable',
            source: 'Sentry instrumentation files and environment',
            detail: envConfigured('SENTRY_DSN')
                ? 'Server Sentry DSN is configured.'
                : 'SENTRY_DSN is missing; client instrumentation may still be configured.',
            checkedAt: now,
            ...(!envConfigured('SENTRY_DSN')
                ? { unavailableReason: 'not_configured' as const }
                : {}),
        },
        {
            id: 'metrics',
            label: 'Prometheus metrics',
            status: 'healthy',
            source: 'lib/observability/metrics.ts',
            detail: 'Prometheus registry is available through /api/metrics.',
            checkedAt: now,
        },
    ];

    return checks;
}

function getEnvironment(): EnvironmentVariable[] {
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

async function getProviders(userId?: string): Promise<ProviderHealth[]> {
    const now = checkedAt();
    const developer = await getDeveloperSnapshot(userId).catch(() => ({
        connectedProviders: [] as string[],
    }));
    const connected = new Set(developer.connectedProviders);
    const configured = (name: string) => envConfigured(name);

    return [
        {
            id: 'github',
            label: 'GitHub',
            status: connected.has('github') || configured('GITHUB_TOKEN') ? 'healthy' : 'unavailable',
            authState: connected.has('github') || configured('GITHUB_TOKEN') ? 'connected' : 'not_configured',
            detail: connected.has('github')
                ? 'User integration token resolved.'
                : configured('GITHUB_TOKEN')
                  ? 'Server token configured.'
                  : 'No GitHub token resolved.',
            checkedAt: now,
        },
        {
            id: 'linear',
            label: 'Linear',
            status: connected.has('linear') || configured('LINEAR_API_KEY') ? 'healthy' : 'unavailable',
            authState: connected.has('linear') || configured('LINEAR_API_KEY') ? 'connected' : 'not_configured',
            detail: connected.has('linear')
                ? 'User integration token resolved.'
                : configured('LINEAR_API_KEY')
                  ? 'Server token configured.'
                  : 'No Linear token resolved.',
            checkedAt: now,
        },
        {
            id: 'stripe',
            label: 'Stripe',
            status: configured('STRIPE_SECRET_KEY') ? 'healthy' : 'unavailable',
            authState: configured('STRIPE_SECRET_KEY') ? 'connected' : 'not_configured',
            detail: configured('STRIPE_SECRET_KEY')
                ? 'Stripe secret key is configured.'
                : 'Stripe secret key is missing.',
            checkedAt: now,
        },
        {
            id: 'openai',
            label: 'OpenAI',
            status: configured('OPENAI_API_KEY') ? 'healthy' : 'unavailable',
            authState: configured('OPENAI_API_KEY') ? 'connected' : 'not_configured',
            detail: configured('OPENAI_API_KEY')
                ? 'OpenAI API key is configured.'
                : 'OpenAI API key is missing.',
            checkedAt: now,
        },
        {
            id: 'google',
            label: 'Google APIs',
            status:
                configured('GOOGLE_CLIENT_ID') && configured('GOOGLE_CLIENT_SECRET')
                    ? 'healthy'
                    : 'unavailable',
            authState:
                configured('GOOGLE_CLIENT_ID') && configured('GOOGLE_CLIENT_SECRET')
                    ? 'connected'
                    : 'not_configured',
            detail: 'OAuth readiness is derived from server env configuration; token freshness is provider-specific.',
            checkedAt: now,
        },
    ];
}

async function getQueueCounts(name: string): Promise<QueueSnapshot> {
    const now = checkedAt();
    if (!process.env.REDIS_URL) {
        return {
            name,
            status: 'unavailable',
            adapter: 'BullMQ',
            detail: 'REDIS_URL is not configured.',
            checkedAt: now,
            unavailableReason: 'not_configured',
        };
    }

    const connection = new IORedis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        lazyConnect: true,
    });
    const queue = new Queue(name, { connection });
    try {
        await connection.connect();
        const counts = await queue.getJobCounts(
            'waiting',
            'active',
            'completed',
            'failed',
            'delayed',
            'paused',
        );
        return {
            name,
            status: (counts.failed ?? 0) > 0 ? 'degraded' : 'healthy',
            adapter: 'BullMQ',
            counts: {
                waiting: counts.waiting ?? 0,
                active: counts.active ?? 0,
                completed: counts.completed ?? 0,
                failed: counts.failed ?? 0,
                delayed: counts.delayed ?? 0,
                paused: counts.paused ?? 0,
            },
            checkedAt: now,
        };
    } catch (error) {
        return {
            name,
            status: 'unhealthy',
            adapter: 'BullMQ',
            detail: error instanceof Error ? error.message : 'Unable to connect to Redis.',
            checkedAt: now,
            unavailableReason: 'runtime_unreachable',
        };
    } finally {
        await queue.close().catch(() => undefined);
        await connection.quit().catch(() => undefined);
    }
}

async function getQueues(): Promise<QueueSnapshot[]> {
    return Promise.all([
        getQueueCounts('unified-action-engine'),
        getQueueCounts('news-event-ingestion'),
    ]);
}

async function getCronJobs(): Promise<CronJobDefinition[]> {
    const vercelPath = path.join(root, 'vercel.json');
    if (!(await pathExists(vercelPath))) {
        return [
            {
                id: 'vercel-cron',
                source: 'vercel.json',
                status: 'unavailable',
                detail: 'No vercel.json file found.',
            },
        ];
    }

    const parsed = JSON.parse(await fs.readFile(vercelPath, 'utf8')) as {
        crons?: Array<{ path: string; schedule: string }>;
    };
    if (!parsed.crons?.length) {
        return [
            {
                id: 'vercel-cron',
                source: 'vercel.json',
                status: 'unavailable',
                detail: 'No Vercel cron entries are registered.',
            },
        ];
    }

    return parsed.crons.map((cron) => ({
        id: cron.path,
        source: 'vercel.json',
        status: 'healthy',
        schedule: cron.schedule,
        endpoint: cron.path,
    }));
}

async function getContainers(): Promise<ContainerSnapshot[]> {
    const now = checkedAt();
    try {
        const docker = new Docker();
        const containers = await docker.listContainers({ all: true });
        return containers.map((container) => ({
            id: container.Id,
            name: container.Names[0]?.replace(/^\//, '') ?? container.Id.slice(0, 12),
            image: container.Image,
            status: container.State === 'running' ? 'healthy' : 'degraded',
            state: container.State,
            ports: container.Ports.map((port) =>
                port.PublicPort
                    ? `${port.PrivatePort}->${port.PublicPort}/${port.Type}`
                    : `${port.PrivatePort}/${port.Type}`,
            ),
            checkedAt: now,
        }));
    } catch {
        return [];
    }
}

function parseColumnDefinitions(body: string): SchemaTable['columns'] {
    return body
        .split('\n')
        .map((line) => line.trim().replace(/,$/, ''))
        .filter((line) => line && !line.toLowerCase().startsWith('constraint'))
        .map((line) => {
            const parts = line.split(/\s+/);
            const name = parts[0]?.replaceAll('"', '') ?? 'unknown';
            const lower = line.toLowerCase();
            return {
                name,
                type: parts.slice(1, 3).join(' '),
                nullable: !lower.includes('not null'),
                ...(lower.includes('default')
                    ? { defaultValue: line.slice(lower.indexOf('default')) }
                    : {}),
            };
        });
}

async function getSchemaFromMigrations(): Promise<SchemaSnapshot> {
    const migrationRoot = path.join(root, 'supabase', 'migrations');
    const tables = new Map<string, SchemaTable>();
    if (!(await pathExists(migrationRoot))) {
        return {
            status: 'unavailable',
            source: 'supabase/migrations',
            tables: [],
            detail: 'No Supabase migration directory exists.',
            checkedAt: checkedAt(),
            unavailableReason: 'integration_missing',
        };
    }

    const files = (await fs.readdir(migrationRoot))
        .filter((file) => file.endsWith('.sql'))
        .sort();
    for (const file of files) {
        const source = await fs.readFile(path.join(migrationRoot, file), 'utf8');
        for (const match of source.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:"?(\w+)"?\.)?"?(\w+)"?\s*\(([\s\S]*?)\);/gi)) {
            const schema = match[1] ?? 'public';
            const name = match[2] ?? 'unknown';
            const body = match[3] ?? '';
            tables.set(`${schema}.${name}`, {
                schema,
                name,
                columns: parseColumnDefinitions(body),
                relationships: [],
                policies: [],
                indexes: [],
            });
        }
        for (const match of source.matchAll(/create\s+policy\s+"?([^"\n]+)"?\s+on\s+"?(\w+)"?\.?"?(\w+)"?/gi)) {
            const policy = match[1];
            const table = match[3] ?? match[2];
            const key = `public.${table}`;
            const existing = tables.get(key);
            if (existing && policy) existing.policies.push(policy);
        }
        for (const match of source.matchAll(/create\s+(?:unique\s+)?index\s+(?:if\s+not\s+exists\s+)?("?[\w_]+"?)\s+on\s+(?:"?(\w+)"?\.)?"?(\w+)"?/gi)) {
            const index = match[1]?.replaceAll('"', '');
            const schema = match[2] ?? 'public';
            const table = match[3];
            const existing = table ? tables.get(`${schema}.${table}`) : undefined;
            if (existing && index) existing.indexes.push(index);
        }
        for (const match of source.matchAll(/foreign\s+key\s*\("?(\w+)"?\)\s+references\s+(?:"?(\w+)"?\.)?"?(\w+)"?\s*\("?(\w+)"?\)/gi)) {
            const column = match[1];
            const referencesTable = match[3];
            const referencesColumn = match[4];
            if (!column || !referencesTable || !referencesColumn) continue;
            for (const table of tables.values()) {
                if (source.includes(`alter table`) || source.includes(table.name)) {
                    table.relationships.push({
                        column,
                        referencesTable,
                        referencesColumn,
                    });
                    break;
                }
            }
        }
    }

    return {
        status: tables.size ? 'healthy' : 'unavailable',
        source: 'supabase/migrations',
        tables: [...tables.values()].sort((a, b) =>
            `${a.schema}.${a.name}`.localeCompare(`${b.schema}.${b.name}`),
        ),
        detail: tables.size
            ? 'Schema metadata parsed from committed Supabase migrations; no production rows are read.'
            : 'No CREATE TABLE statements were discovered in migrations.',
        checkedAt: checkedAt(),
    };
}

async function getFeatureFlags(): Promise<FeatureFlag[]> {
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

async function getMetrics() {
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

function getLogSources(): LogSource[] {
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
            status: envConfigured('SENTRY_AUTH_TOKEN') ? 'healthy' : 'unavailable',
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
