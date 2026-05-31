import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './env.js';
import { batchRoutes } from './routes/batches.js';
import { healthRoutes } from './routes/health.js';
import { jobRoutes } from './routes/jobs.js';

const UNAUTHENTICATED_PATHS = new Set(['/health', '/ready']);

// In-memory sliding-window rate limiter keyed by client IP.
// Tracks request timestamps per IP; prunes expired entries every window.
const rateLimitWindows = new Map<string, number[]>();
const rateLimitPruner = setInterval(() => {
    const cutoff = Date.now() - env.CONVERSION_RATE_LIMIT_WINDOW_MS;
    for (const [ip, timestamps] of rateLimitWindows) {
        const fresh = timestamps.filter((t) => t > cutoff);
        if (fresh.length === 0) rateLimitWindows.delete(ip);
        else rateLimitWindows.set(ip, fresh);
    }
}, env.CONVERSION_RATE_LIMIT_WINDOW_MS);
rateLimitPruner.unref();

export function buildServer() {
    const app = Fastify({
        logger: true,
        trustProxy: true,
        genReqId: () => crypto.randomUUID(),
    });

    // Validate API key on every request if CONVERSION_API_KEY is configured.
    // Health/readiness endpoints are exempt so orchestrators can probe without credentials.
    app.addHook('onRequest', async (request, reply) => {
        const key = env.CONVERSION_API_KEY;
        if (!key || UNAUTHENTICATED_PATHS.has(request.url)) return;
        if (request.headers['x-conversion-api-key'] !== key) {
            return reply.status(401).send({ error: 'Unauthorized.' });
        }
    });

    // Rate limit job creation: POST /v1/jobs only.
    app.addHook('onRequest', async (request, reply) => {
        if (request.method !== 'POST' || !request.url.startsWith('/v1/jobs'))
            return;
        const ip = request.ip;
        const now = Date.now();
        const cutoff = now - env.CONVERSION_RATE_LIMIT_WINDOW_MS;
        const timestamps = (rateLimitWindows.get(ip) ?? []).filter(
            (t) => t > cutoff,
        );
        if (timestamps.length >= env.CONVERSION_RATE_LIMIT_MAX) {
            return reply.status(429).send({ error: 'Too many requests.' });
        }
        timestamps.push(now);
        rateLimitWindows.set(ip, timestamps);
    });

    void app.register(cors, {
        origin: true,
        methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    });
    void app.register(healthRoutes);
    void app.register(jobRoutes);
    void app.register(batchRoutes);

    return app;
}
