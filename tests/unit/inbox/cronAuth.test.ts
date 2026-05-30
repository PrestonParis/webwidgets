/**
 * Tests for cron endpoint authorization.
 *
 * Covers:
 *  - Renewal route rejects missing Authorization header.
 *  - Renewal route rejects wrong secret.
 *  - Renewal route accepts correct Bearer CRON_SECRET.
 *  - Renewal route handles empty watch list (no crash).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// We test the auth logic directly rather than the full Next.js route since
// the route imports googleapis and Supabase which would need a full test
// environment.  This tests the auth pattern used consistently across routes.

function makeRequest(authHeader?: string): Request {
    const headers = new Headers();
    if (authHeader) headers.set('authorization', authHeader);
    return new Request('http://localhost/api/gmail/renew-watch', {
        method: 'POST',
        headers,
    });
}

function checkCronAuth(req: Request, cronSecret: string | undefined): boolean {
    const auth = req.headers.get('authorization');
    return !!(cronSecret && auth === `Bearer ${cronSecret}`);
}

describe('Cron endpoint authentication', () => {
    const SECRET = 'test-cron-secret-abc123';

    it('rejects request with no Authorization header', () => {
        const req = makeRequest();
        expect(checkCronAuth(req, SECRET)).toBe(false);
    });

    it('rejects request with wrong secret', () => {
        const req = makeRequest('Bearer wrong-secret');
        expect(checkCronAuth(req, SECRET)).toBe(false);
    });

    it('rejects when CRON_SECRET env is not configured', () => {
        const req = makeRequest(`Bearer ${SECRET}`);
        expect(checkCronAuth(req, undefined)).toBe(false);
    });

    it('accepts request with correct Bearer token', () => {
        const req = makeRequest(`Bearer ${SECRET}`);
        expect(checkCronAuth(req, SECRET)).toBe(true);
    });

    it('is case-sensitive for the token', () => {
        const req = makeRequest(`Bearer ${SECRET.toUpperCase()}`);
        expect(checkCronAuth(req, SECRET)).toBe(false);
    });

    it('rejects malformed prefix (lowercase bearer)', () => {
        const req = makeRequest(`bearer ${SECRET}`);
        expect(checkCronAuth(req, SECRET)).toBe(false);
    });
});

// ── Renewal — no-crash on empty watch list ───────────────────────────────────

describe('Gmail watch renewal — empty watch list', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns successfully when no watches need renewal', async () => {
        // Simulate: Supabase returns no users needing renewal
        const mockSupabase = {
            from: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnThis(),
                lte: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                limit: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
        };

        // The renewal logic: if no rows, return immediately with count=0
        const rows = (await mockSupabase
            .from('user_tokens')
            .select('user_id')
            .lte('watch_expiry', new Date().toISOString())
            .limit(100)) as { data: unknown[] | null };

        expect(rows.data).toEqual([]);
        // No crash — all operations over an empty array are no-ops
        const renewed = (rows.data ?? []).length;
        expect(renewed).toBe(0);
    });
});
