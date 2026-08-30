import { timingSafeEqual } from 'node:crypto';
import {
    createServer,
    type IncomingMessage,
    type Server,
    type ServerResponse,
} from 'node:http';
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

type HeartbeatRecorder = (readiness: ReadinessResult) => Promise<void>;

const briefingRequestSchema = z.object({
    userId: z.string().uuid(),
    trigger: z.enum(['daily', 'on_demand']),
    coveredFrom: z.string().datetime(),
    coveredTo: z.string().datetime(),
    idempotencyKey: z.string().min(1).max(700),
});

type BriefingRequest = z.infer<typeof briefingRequestSchema>;

const actionRequestSchema = z.object({
    userId: z.string().uuid(),
    actionRequestId: z.string().uuid(),
    idempotencyKey: z.string().min(1).max(700),
});

type ActionRequest = z.infer<typeof actionRequestSchema>;

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
            boundedCheck(() => checks.redis(), timeoutMs),
            boundedCheck(() => checks.supabase(), timeoutMs),
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
    for await (const chunk of request as AsyncIterable<unknown>) {
        if (!(typeof chunk === 'string' || chunk instanceof Uint8Array)) {
            throw new Error('invalid_body_chunk');
        }
        const buffer = Buffer.from(chunk);
        size += buffer.length;
        if (size > 32_768) throw new Error('body_too_large');
        chunks.push(buffer);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
}

interface RequestHandlerOptions {
    token: string;
    checkReadiness: () => Promise<ReadinessResult>;
    isShuttingDown: () => boolean;
    enqueueBriefing: (input: BriefingRequest) => Promise<string>;
    enqueueAction: (input: ActionRequest) => Promise<string>;
}

function createRequestHandler(options: RequestHandlerOptions) {
    return async (request: IncomingMessage, response: ServerResponse) => {
        if (request.method === 'POST' && request.url === '/v1/jobs/briefings') {
            if (!authorized(request, options.token)) {
                respond(response, 401, { status: 'unauthorized' });
                return;
            }
            try {
                const input = briefingRequestSchema.parse(
                    await readBody(request),
                );
                const jobId = await options.enqueueBriefing(input);
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
        if (request.method === 'POST' && request.url === '/v1/jobs/actions') {
            if (!authorized(request, options.token)) {
                respond(response, 401, { status: 'unauthorized' });
                return;
            }
            try {
                const input = actionRequestSchema.parse(
                    await readBody(request),
                );
                const jobId = await options.enqueueAction(input);
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
            const shuttingDown = options.isShuttingDown();
            respond(response, shuttingDown ? 503 : 200, {
                status: shuttingDown ? 'stopping' : 'alive',
            });
            return;
        }
        if (request.url === '/ready') {
            const readiness = await options.checkReadiness();
            respond(response, readiness.ready ? 200 : 503, readiness);
            return;
        }
        respond(response, 404, { status: 'not_found' });
    };
}

export async function startHealthServer(
    env: WorkerEnv,
    store: DurableJobStore,
    logger: RuntimeLogger,
    enqueueBriefing: (input: BriefingRequest) => Promise<string>,
    enqueueAction: (input: ActionRequest) => Promise<string>,
    recordHeartbeat: HeartbeatRecorder,
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
    const handleRequest = createRequestHandler({
        token: env.WORKER_API_TOKEN,
        checkReadiness,
        isShuttingDown: () => shuttingDown,
        enqueueBriefing,
        enqueueAction,
    });
    const server = createServer((request, response) => {
        void handleRequest(request, response).catch(() => {
            if (!response.headersSent) {
                respond(response, 503, { status: 'health_check_failed' });
            }
        });
    });
    await listen(server, env.HEALTH_PORT);
    const writeHeartbeat = async () => {
        const readiness = await checkReadiness();
        try {
            await recordHeartbeat(readiness);
        } catch {
            logger.warn('worker heartbeat persistence failed', {
                instanceId: env.WORKER_INSTANCE_ID ?? null,
            });
        } finally {
            logger[readiness.ready ? 'info' : 'warn']('worker heartbeat', {
                instanceId: env.WORKER_INSTANCE_ID ?? null,
                ready: readiness.ready,
                redis: readiness.redis,
                supabase: readiness.supabase,
            });
        }
    };
    const heartbeat = setInterval(
        () => void writeHeartbeat(),
        env.HEARTBEAT_INTERVAL_MS,
    );
    heartbeat.unref();
    void writeHeartbeat();
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
