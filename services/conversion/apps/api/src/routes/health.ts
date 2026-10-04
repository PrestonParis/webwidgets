import type { FastifyInstance } from 'fastify';
import { pool } from '../db/client.js';
import { redisConnection } from '../services/queue.js';

export function healthRoutes(app: FastifyInstance) {
    app.get('/health', () => ({
        ok: true,
        service: 'webwidgets-conversion-api',
    }));

    // Readiness: verifies live connectivity to Postgres and Redis.
    // Returns 503 if either dependency is unavailable.
    app.get('/ready', async (_request, reply) => {
        const checks: Record<string, 'ok' | 'error'> = {};

        try {
            await pool.query('SELECT 1');
            checks.db = 'ok';
        } catch {
            checks.db = 'error';
        }

        try {
            await redisConnection.ping();
            checks.redis = 'ok';
        } catch {
            checks.redis = 'error';
        }

        const ready = checks.db === 'ok' && checks.redis === 'ok';
        return reply.status(ready ? 200 : 503).send({ ok: ready, checks });
    });
}
