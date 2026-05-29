import fs from 'node:fs/promises';
import path from 'node:path';
import {
    checkMlService,
    checkSupabaseRest,
} from '@/lib/connectors/serviceHealth';
import type {
    DiagnosticCheck,
    RouteDefinition,
} from '@/features/developer/schemas/infrastructureSchemas';
import {
    checkedAt,
    envConfigured,
    pathExists,
    statusFromOk,
} from './infraUtils';

const root = process.cwd();

export async function discoverRoutes(): Promise<RouteDefinition[]> {
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
            if (entry.name !== 'route.ts' && entry.name !== 'route.tsx')
                continue;
            const source = await fs.readFile(fullPath, 'utf8');
            const methods = [
                ...source.matchAll(
                    /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g,
                ),
            ]
                .map((m) => m[1])
                .filter((m): m is string => Boolean(m));
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

export async function getOverview(
    routes: RouteDefinition[],
): Promise<DiagnosticCheck[]> {
    const now = checkedAt();
    const [supabaseRest, ml] = await Promise.all([
        checkSupabaseRest(),
        checkMlService(),
    ]);

    return [
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
    ] satisfies DiagnosticCheck[];
}
