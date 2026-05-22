import net from 'node:net';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildServer } from '../../apps/api/src/server.js';
import { assertJobAllowed } from '../../apps/api/src/lib/filePolicy.js';
import { HttpError } from '../../apps/api/src/lib/errors.js';

// Quick TCP probe — avoids hanging on Redis ping when the stack isn't running.
function tcpReachable(port: number, host = '127.0.0.1', timeoutMs = 1500): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => resolve(false));
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

async function infraRunning(): Promise<boolean> {
  const [pg, redis] = await Promise.all([tcpReachable(5433), tcpReachable(6380)]);
  return pg && redis;
}

// ---------------------------------------------------------------------------
// Shared test helpers
// ---------------------------------------------------------------------------

function validJobPayload(overrides: Record<string, unknown> = {}) {
  return {
    originalFileName: 'sample.md',
    sourceMime: 'text/plain',
    sourceExtension: 'md',
    targetExtension: 'html',
    fileSizeBytes: 1024,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Group 1: Direct filePolicy validation — zero infra required
// ---------------------------------------------------------------------------

describe('assertJobAllowed (no infra)', () => {
  it('rejects oversized file', () => {
    expect(() =>
      assertJobAllowed(validJobPayload({ fileSizeBytes: 9_999_999_999 }) as Parameters<typeof assertJobAllowed>[0])
    ).toThrow(HttpError);
  });

  it('rejects disallowed MIME type', () => {
    expect(() =>
      assertJobAllowed(validJobPayload({ sourceMime: 'application/x-executable' }) as Parameters<typeof assertJobAllowed>[0])
    ).toThrow(HttpError);
  });

  it('rejects unsupported conversion pair', () => {
    expect(() =>
      assertJobAllowed(
        validJobPayload({
          originalFileName: 'sample.txt',
          sourceExtension: 'txt',
          targetExtension: 'html',
        }) as Parameters<typeof assertJobAllowed>[0]
      )
    ).toThrow(HttpError);
  });

  it('rejects double extension filename', () => {
    expect(() =>
      assertJobAllowed(
        validJobPayload({
          originalFileName: 'suspicious.exe.docx',
          sourceExtension: 'docx',
          targetExtension: 'pdf',
          sourceMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }) as Parameters<typeof assertJobAllowed>[0]
      )
    ).toThrow(HttpError);
  });

  it('rejects extension mismatch', () => {
    expect(() =>
      assertJobAllowed(
        validJobPayload({
          originalFileName: 'sample.pdf',  // filename says .pdf
          sourceExtension: 'md',           // body claims md
        }) as Parameters<typeof assertJobAllowed>[0]
      )
    ).toThrow(HttpError);
  });

  it('accepts valid md→html request', () => {
    expect(() => assertJobAllowed(validJobPayload() as Parameters<typeof assertJobAllowed>[0])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Group 2: HTTP endpoint tests via Fastify inject — no infra required
// These tests only exercise code paths that fail before any DB/Redis access.
// The background Redis reconnect is cosmetic noise, not a test failure.
// ---------------------------------------------------------------------------

describe('API HTTP endpoints (no infra)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true });
  });

  it('GET /v1/conversions returns a list', async () => {
    const res = await app.inject({ method: 'GET', url: '/v1/conversions' });
    expect(res.statusCode).toBe(200);
    const { conversions } = res.json<{ conversions: unknown[] }>();
    expect(Array.isArray(conversions)).toBe(true);
    expect(conversions.length).toBeGreaterThan(0);
  });

  it('POST /v1/jobs with unsupported conversion → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      payload: validJobPayload({ sourceExtension: 'txt', targetExtension: 'html', originalFileName: 'sample.txt' }),
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBeTruthy();
  });

  it('POST /v1/jobs with double extension → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      payload: validJobPayload({
        originalFileName: 'suspicious.exe.docx',
        sourceExtension: 'docx',
        targetExtension: 'pdf',
        sourceMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /v1/jobs with blocked MIME type → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      payload: validJobPayload({ sourceMime: 'application/x-executable' }),
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /v1/jobs oversized → 413', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      payload: validJobPayload({ fileSizeBytes: 9_999_999_999 }),
    });
    expect(res.statusCode).toBe(413);
  });

  it('POST /v1/jobs with malformed body → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      payload: { sourceExtension: 'md' }, // missing required fields
    });
    expect(res.statusCode).toBe(400);
  });

});

// ---------------------------------------------------------------------------
// Group 3: API key authentication
// Uses vi.doMock + vi.resetModules so a fresh env singleton is created with
// the key set. This is isolated to this describe block.
// ---------------------------------------------------------------------------

describe('API key authentication (no infra)', () => {
  const MOCK_KEY = 'smoke-test-secret';

  it('returns 401 when key is missing and CONVERSION_API_KEY is set', async () => {
    await vi.resetModules();
    process.env.CONVERSION_API_KEY = MOCK_KEY;
    vi.doMock('../../apps/api/src/env.js', () => ({
      env: {
        CONVERSION_API_PORT: 4010,
        DATABASE_URL: 'postgres://x:x@localhost:5433/x',
        REDIS_URL: 'redis://localhost:6380',
        S3_ENDPOINT: 'http://localhost:9000',
        S3_ACCESS_KEY_ID: 'minioadmin',
        S3_SECRET_ACCESS_KEY: 'minioadmin',
        S3_BUCKET: 'webwidgets-conversions',
        S3_FORCE_PATH_STYLE: true,
        CONVERSION_MAX_FILE_BYTES: 52_428_800,
        CONVERSION_API_KEY: MOCK_KEY,
        S3_CONFIGURE_CORS: false,
        S3_ALLOWED_ORIGINS: '*',
        CONVERSION_OBJECT_TTL_DAYS: 7,
        CLEANUP_INTERVAL_MS: 3_600_000,
        CONVERSION_RATE_LIMIT_MAX: 20,
        CONVERSION_RATE_LIMIT_WINDOW_MS: 60_000,
      },
    }));
    const { buildServer: bs } = await import('../../apps/api/src/server.js');
    const securedApp = bs();
    await securedApp.ready();

    const res = await securedApp.inject({
      method: 'POST',
      url: '/v1/jobs',
      payload: validJobPayload(),
    });
    await securedApp.close();
    await vi.resetModules();
    delete process.env.CONVERSION_API_KEY;

    expect(res.statusCode).toBe(401);
  });

  it('passes auth gate when correct key is sent', async () => {
    await vi.resetModules();
    vi.doMock('../../apps/api/src/env.js', () => ({
      env: {
        CONVERSION_API_PORT: 4010,
        DATABASE_URL: 'postgres://x:x@localhost:5433/x',
        REDIS_URL: 'redis://localhost:6380',
        S3_ENDPOINT: 'http://localhost:9000',
        S3_ACCESS_KEY_ID: 'minioadmin',
        S3_SECRET_ACCESS_KEY: 'minioadmin',
        S3_BUCKET: 'webwidgets-conversions',
        S3_FORCE_PATH_STYLE: true,
        CONVERSION_MAX_FILE_BYTES: 52_428_800,
        CONVERSION_API_KEY: MOCK_KEY,
        S3_CONFIGURE_CORS: false,
        S3_ALLOWED_ORIGINS: '*',
        CONVERSION_OBJECT_TTL_DAYS: 7,
        CLEANUP_INTERVAL_MS: 3_600_000,
        CONVERSION_RATE_LIMIT_MAX: 20,
        CONVERSION_RATE_LIMIT_WINDOW_MS: 60_000,
      },
    }));
    const { buildServer: bs } = await import('../../apps/api/src/server.js');
    const securedApp = bs();
    await securedApp.ready();

    const res = await securedApp.inject({
      method: 'POST',
      url: '/v1/jobs',
      payload: validJobPayload(),
      headers: { 'x-conversion-api-key': MOCK_KEY },
    });
    await securedApp.close();
    await vi.resetModules();

    // Auth passed — may fail at DB (500), but not at auth (401).
    expect(res.statusCode).not.toBe(401);
  });
});

// ---------------------------------------------------------------------------
// Group 4: Infra-dependent endpoint tests
// These run against the same in-process Fastify server but exercise code paths
// that reach Postgres and Redis. They are skipped cleanly when infra is down.
// ---------------------------------------------------------------------------

describe('API HTTP endpoints (requires infra)', () => {
  let app: FastifyInstance;
  let infraAvailable = false;

  beforeAll(async () => {
    // Use a fast TCP probe rather than app.inject('/ready') to avoid hanging
    // on ioredis reconnect when Redis is not running.
    infraAvailable = await infraRunning();
    if (!infraAvailable) {
      console.log('[api-smoke] Infra not running — skipping infra-dependent tests.');
      return;
    }
    app = buildServer();
    await app.ready();
  }, 5000);

  afterAll(async () => {
    await app?.close();
  });

  it('GET /ready returns 200 and all checks pass', async (ctx) => {
    if (!infraAvailable || !app) return ctx.skip();
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ ok: true, checks: { db: 'ok', redis: 'ok' } });
  });

  it('POST /v1/jobs with valid md→html request → 201 with jobId and uploadUrl', async (ctx) => {
    if (!infraAvailable || !app) return ctx.skip();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/jobs',
      payload: validJobPayload(),
    });
    expect(res.statusCode).toBe(201);
    const body = res.json<{ jobId: string; uploadUrl: string; statusUrl: string }>();
    expect(body.jobId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
    expect(typeof body.uploadUrl).toBe('string');
    expect(body.statusUrl).toMatch(`/v1/jobs/${body.jobId}`);
  });

  it('GET /v1/jobs/:id for unknown job → 404', async (ctx) => {
    if (!infraAvailable || !app) return ctx.skip();
    const fakeId = '00000000-0000-0000-0000-000000000000';
    const res = await app.inject({ method: 'GET', url: `/v1/jobs/${fakeId}` });
    expect(res.statusCode).toBe(404);
  });

  it('GET /v1/jobs/:id with non-uuid → 400', async (ctx) => {
    if (!infraAvailable || !app) return ctx.skip();
    const res = await app.inject({ method: 'GET', url: '/v1/jobs/not-a-uuid' });
    expect(res.statusCode).toBe(400);
  });
});
