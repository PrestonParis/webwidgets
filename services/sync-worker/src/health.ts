import { createServer, type Server } from 'node:http';
import IORedis from 'ioredis';
import type { WorkerEnv } from './env.js';
import type { RuntimeLogger } from './logger.js';
import type { DurableJobStore } from './v1/jobStore.js';

export interface ReadinessResult {
    ready: boolean;
    redis: boolean;
    supabase: boolean;
}

export interface RuntimeHealth {
    checkReadiness(): Promise<ReadinessResult>;
    close(): Promise<void>;
}

interface ReadinessChecks {
    redis(): Promise<boolean>;
    supabase(): Promise<boolean>;
}

async function boundedCheck(check: () => Promise<boolean>, timeoutMs: number) {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
    });
    try {
        return await Promise.race([check().catch(() => false), timeout]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

export function createReadinessChecker(
    checks: ReadinessChecks,
    timeoutMs = 3_000,
) {
    return async (): Promise<ReadinessResult> => {
        const [redis, supabase] = await Promise.all([
            boundedCheck(checks.redis, timeoutMs),
            boundedCheck(checks.supabase, timeoutMs),
        ]);
        return { ready: redis && supabase, redis, supabase };
    };
}

function respond(
    response: import('node:http').ServerResponse,
    status: number,
    body: object,
) {
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(body));
}

function listen(server: Server, port: number) {
    return new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '0.0.0.0', () => {
            server.off('error', reject);
            resolve();
        });
    });
}

function closeServer(server: Server) {
    return new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
    });
}

export async function startHealthServer(
    env: WorkerEnv,
    store: DurableJobStore,
    logger: RuntimeLogger,
): Promise<RuntimeHealth> {
    const redis = new IORedis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        lazyConnect: true,
        retryStrategy: () => null,
    });
    redis.on('error', () => undefined);
    const checkReadiness = createReadinessChecker({
        redis: async () => {
            if (redis.status === 'wait' || redis.status === 'end') {
                await redis.connect();
            }
            return (await redis.ping()) === 'PONG';
        },
        supabase: () => store.checkConnection(),
    });
    let shuttingDown = false;
    const server = createServer(async (request, response) => {
        if (request.method !== 'GET') {
            respond(response, 405, { status: 'method_not_allowed' });
            return;
        }
        if (request.url === '/live') {
            respond(response, shuttingDown ? 503 : 200, {
                status: shuttingDown ? 'stopping' : 'alive',
            });
            return;
        }
        if (request.url === '/ready') {
            const readiness = await checkReadiness();
            respond(response, readiness.ready ? 200 : 503, readiness);
            return;
        }
        respond(response, 404, { status: 'not_found' });
    });
    await listen(server, env.HEALTH_PORT);
    const heartbeat = setInterval(() => {
        void checkReadiness().then((readiness) => {
            logger[readiness.ready ? 'info' : 'warn']('worker heartbeat', {
                instanceId: env.WORKER_INSTANCE_ID ?? null,
                ready: readiness.ready,
                redis: readiness.redis,
                supabase: readiness.supabase,
            });
        });
    }, env.HEARTBEAT_INTERVAL_MS);
    heartbeat.unref();
    return {
        checkReadiness,
        close: async () => {
            shuttingDown = true;
            clearInterval(heartbeat);
            await closeServer(server);
            await redis.quit().catch(() => undefined);
        },
    };
}
