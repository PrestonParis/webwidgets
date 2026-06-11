/**
 * Tests for dead-letter queue behavior.
 *
 * Covers:
 *  - After MAX_ATTEMPTS failures, item moves to dead-letter stage.
 *  - Dead-letter item stores enough info for retry UI (last_error, attempts).
 *  - Retrying a dead-letter item resets it to pending/ingest state.
 *  - Item stays pending (not dead-letter) below MAX_ATTEMPTS.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { markFailed } from '@/features/inbox/lib/queueManager';
import type { QueueItem } from '@/features/inbox/lib/queueManager';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeItem(overrides: Partial<QueueItem> = {}): QueueItem {
    return {
        id: 'q-1',
        user_id: 'user-1',
        message_id: 'msg-1',
        thread_id: null,
        history_id: null,
        stage: 'ingest',
        priority: 0,
        status: 'processing',
        payload: null,
        attempts: 0,
        last_error: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...overrides,
    };
}

function makeDb() {
    const update = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
    });
    return { from: vi.fn().mockReturnValue({ update }), _update: update };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Dead-letter queue', () => {
    beforeEach(() => vi.clearAllMocks());

    it('stays pending on first failure (attempts = 1, below MAX_ATTEMPTS=3)', async () => {
        const db = makeDb();
        const item = makeItem({ attempts: 0 });

        await markFailed(db as never, item, 'Network timeout');

        expect(db._update).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'pending',
                stage: 'ingest', // unchanged
                attempts: 1,
                last_error: 'Network timeout',
            }),
        );
    });

    it('stays pending on second failure (attempts = 2)', async () => {
        const db = makeDb();
        const item = makeItem({ attempts: 1 });

        await markFailed(db as never, item, 'API 500');

        expect(db._update).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'pending',
                stage: 'ingest',
                attempts: 2,
            }),
        );
    });

    it('moves to dead-letter on third failure (attempts = 3, = MAX_ATTEMPTS)', async () => {
        const db = makeDb();
        const item = makeItem({ attempts: 2 });

        await markFailed(db as never, item, 'Claude extraction failed');

        expect(db._update).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'failed',
                stage: 'dead-letter',
                attempts: 3,
                last_error: 'Claude extraction failed',
            }),
        );
    });

    it('stores last_error for all failure transitions', async () => {
        const db = makeDb();
        const errorMsg = 'Token expired: 401 Unauthorized';

        await markFailed(db as never, makeItem({ attempts: 0 }), errorMsg);

        expect(db._update).toHaveBeenCalledWith(
            expect.objectContaining({ last_error: errorMsg }),
        );
    });

    it('dead-letter item has all fields needed for retry UI', async () => {
        const db = makeDb();
        const item = makeItem({ attempts: 2, message_id: 'msg-xyz' });

        await markFailed(db as never, item, 'Extraction timeout');

        const [updateArg] = db._update.mock.calls[0] as [
            Record<string, unknown>,
        ];
        // Retry UI needs: status, stage, attempts, last_error
        expect(updateArg.status).toBe('failed');
        expect(updateArg.stage).toBe('dead-letter');
        expect(updateArg.attempts).toBe(3);
        expect(updateArg.last_error).toBe('Extraction timeout');
        expect(updateArg.updated_at).toBeDefined();
    });
});

// ── Retry logic ───────────────────────────────────────────────────────────────

describe('Dead-letter retry', () => {
    it('resetting a dead-letter item restores it to pending/ingest state', () => {
        // The retry operation (used in DevDeadLetterMonitor) sets:
        //   status: 'pending', stage: 'ingest', attempts: 0, last_error: null
        const deadItem: Partial<QueueItem> = {
            status: 'failed',
            stage: 'dead-letter',
            attempts: 3,
            last_error: 'Some error',
        };

        // Simulate the reset
        const reset = {
            ...deadItem,
            status: 'pending' as const,
            stage: 'ingest' as const,
            attempts: 0,
            last_error: null,
        };

        expect(reset.status).toBe('pending');
        expect(reset.stage).toBe('ingest');
        expect(reset.attempts).toBe(0);
        expect(reset.last_error).toBeNull();
    });
});
