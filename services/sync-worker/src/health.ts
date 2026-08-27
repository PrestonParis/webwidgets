import { timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import IORedis from 'ioredis';
import { z } from 'zod';
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

const briefingRequestSchema = z.object({
    userId: z.string().uuid(),
    trigger: z.enum(['daily', 'on_demand']),
    coveredFrom: z.string().datetime(),
    coveredTo: z.string().datetime(),
    idempotencyKey: z.string().min(1).max(700),
});

type BriefingRequest = z.infer<typeof briefingRequestSchema>;

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

function authorized(request: IncomingMessage, token: string) {
    const supplied = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!supplied) return false;
    const left = Buffer.from(token);
    const right = Buffer.from(supplied);
    return left.length === right.length && timingSafeEqual(left, right);
}

async function readBody(request: IncomingMessage) {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
        const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        size += buffer.length;
        if (size > 32_768) throw new Error('body_too_large');
        chunks.push(buffer);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

export async function startHealthServer(
    env: WorkerEnv,
    store: DurableJobStore,
    logger: RuntimeLogger,
    enqueueBriefing: (input: BriefingRequest) => Promise<string>,
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
        if (request.method === 'POST' && request.url === '/v1/jobs/briefings') {
            if (!authorized(request, env.WORKER_API_TOKEN)) {
                respond(response, 401, { status: 'unauthorized' });
                return;
            }
            try {
                const input = briefingRequestSchema.parse(
                    await readBody(request),
                );
                const jobId = await enqueueBriefing(input);
                respond(response, 202, { jobId });
            } catch (error) {
                const status = error instanceof z.ZodError ? 400 : 503;
                respond(response, status, {
                    status:
                        status === 400 ? 'invalid_request' : 'enqueue_failed',
                });
            }
            return;
        }
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
