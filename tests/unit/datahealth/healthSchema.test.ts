import { describe, it, expect } from 'vitest';
import { z } from 'zod';

// Mirror of the schema in useDataHealth — tests the parsing contract
// so we catch regressions if the /api/health response shape changes.
const checkSchema = z.object({
    status: z.enum(['ok', 'error']),
    latencyMs: z.number().optional(),
});
const healthResponseSchema = z.object({
    status: z.enum(['ok', 'degraded']),
    checks: z.record(z.string(), checkSchema),
});

const HEALTHY: unknown = {
    status: 'ok',
    timestamp: '2026-05-16T00:00:00Z',
    version: '1.0.0',
    checks: {
        database: { status: 'ok', latencyMs: 12 },
        ml_service: { status: 'ok', latencyMs: 48 },
    },
};

const DEGRADED: unknown = {
    status: 'degraded',
    timestamp: '2026-05-16T00:00:00Z',
    checks: {
        database: { status: 'ok', latencyMs: 10 },
        ml_service: { status: 'error', latencyMs: 2001 },
    },
};

describe('healthResponseSchema', () => {
    it('parses a fully healthy response', () => {
        const result = healthResponseSchema.safeParse(HEALTHY);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.data.status).toBe('ok');
        expect(result.data.checks['database']?.status).toBe('ok');
        expect(result.data.checks['database']?.latencyMs).toBe(12);
    });

    it('parses a degraded response', () => {
        const result = healthResponseSchema.safeParse(DEGRADED);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.data.status).toBe('degraded');
        expect(result.data.checks['ml_service']?.status).toBe('error');
    });

    it('tolerates extra top-level fields (timestamp, version)', () => {
        // The schema is strict only on the fields we care about
        const result = healthResponseSchema.safeParse(HEALTHY);
        expect(result.success).toBe(true);
    });

    it('rejects an invalid status string', () => {
        const bad = { ...(HEALTHY as object), status: 'unknown' };
        expect(healthResponseSchema.safeParse(bad).success).toBe(false);
    });

    it('rejects a missing checks field', () => {
        const bad = { status: 'ok' };
        expect(healthResponseSchema.safeParse(bad).success).toBe(false);
    });

    it('rejects a check with invalid status', () => {
        const bad = {
            status: 'ok',
            checks: { database: { status: 'pending' } },
        };
        expect(healthResponseSchema.safeParse(bad).success).toBe(false);
    });

    it('accepts checks without latencyMs (optional)', () => {
        const noLatency: unknown = {
            status: 'ok',
            checks: { database: { status: 'ok' } },
        };
        const result = healthResponseSchema.safeParse(noLatency);
        expect(result.success).toBe(true);
        if (!result.success) return;
        expect(result.data.checks['database']?.latencyMs).toBeUndefined();
    });
});
