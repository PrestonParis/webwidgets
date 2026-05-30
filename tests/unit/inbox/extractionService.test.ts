/**
 * Tests for the shared emailExtractionService.
 *
 * Covers:
 *  - Gmail: queued email creates classification and actions.
 *  - Gmail: re-running the same email is idempotent (no duplicates).
 *  - Outlook: snapshot without body falls back to snippet.
 *  - Outlook: snapshot with body uses it.
 *  - Outlook: re-running is idempotent.
 *  - Provider IDs do not collide.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    processEmail,
    processBatch,
} from '@/features/inbox/server/emailExtractionService';

// ── Mock extractActions ───────────────────────────────────────────────────────

vi.mock('@/features/inbox/lib/extractActions', () => ({
    extractEmailActions: vi.fn().mockResolvedValue(
        new Map([
            [
                'gmail:msg-1',
                [
                    {
                        type: 'action',
                        title: 'Pay invoice',
                        description: null,
                        due_date: null,
                        action_url: null,
                    },
                ],
            ],
        ]),
    ),
}));

vi.mock('@/features/inbox/lib/modelRouter', () => ({
    routeInference: vi.fn().mockResolvedValue(new Map([[0, 'finance']])),
}));

// ── Mock Supabase ─────────────────────────────────────────────────────────────

function makeDb(alreadyProcessed = false) {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi
            .fn()
            .mockResolvedValue(
                alreadyProcessed
                    ? { data: { email_id: 'gmail:msg-1' } }
                    : { data: null },
            ),
        upsert,
    };
    return {
        from: vi.fn().mockReturnValue(chain),
        _upsert: upsert,
        _chain: chain,
    };
}

// ── Gmail pipeline tests ──────────────────────────────────────────────────────

describe('Gmail extraction pipeline', () => {
    beforeEach(() => vi.clearAllMocks());

    it('classifies and extracts actions for a new email', async () => {
        const db = makeDb(false);
        const result = await processEmail(
            db as never,
            {
                userId: 'u1',
                provider: 'gmail',
                emailId: 'gmail:msg-1',
                subject: 'Invoice #1001 due',
                sender: 'billing@acme.com',
                bodyText: 'Please pay invoice #1001 of $500 by June 1.',
            },
            { apiKey: 'sk-test', useAI: true },
        );

        expect(result.alreadyProcessed).toBe(false);
        expect(result.classified).toBe(true);
        expect(result.actionsStored).toBeGreaterThan(0);

        // Should have upserted into email_actions and email_processing_log
        const upsertCalls = db._upsert.mock.calls.map((c: unknown[][]) => c[0]);
        const logUpsert = upsertCalls.find(
            (rows: unknown) =>
                Array.isArray(rows) &&
                (rows as Record<string, unknown>[])[0]?.email_id ===
                    'gmail:msg-1' &&
                !(rows as Record<string, unknown>[])[0]?.type,
        );
        expect(logUpsert).toBeDefined();
    });

    it('is idempotent — second run returns alreadyProcessed', async () => {
        const db = makeDb(true); // simulate already-processed
        const result = await processEmail(
            db as never,
            {
                userId: 'u1',
                provider: 'gmail',
                emailId: 'gmail:msg-1',
            },
            { apiKey: 'sk-test', useAI: true },
        );

        expect(result.alreadyProcessed).toBe(true);
        expect(result.actionsStored).toBe(0);
        expect(db._upsert).not.toHaveBeenCalled();
    });

    it('skips extraction when useAI is false', async () => {
        const { extractEmailActions } =
            await import('@/features/inbox/lib/extractActions');
        vi.clearAllMocks();
        const db = makeDb(false);

        await processEmail(
            db as never,
            { userId: 'u2', provider: 'gmail', emailId: 'gmail:msg-2' },
            { useAI: false },
        );

        expect(extractEmailActions).not.toHaveBeenCalled();
    });
});

// ── Outlook pipeline tests ────────────────────────────────────────────────────

describe('Outlook extraction pipeline', () => {
    beforeEach(() => vi.clearAllMocks());

    it('processes snapshot with body_text populated by sync', async () => {
        const db = makeDb(false);
        const result = await processEmail(
            db as never,
            {
                userId: 'u3',
                provider: 'outlook',
                emailId: 'outlook:abc123',
                subject: 'Contract renewal',
                sender: 'legal@partner.com',
                bodyText: 'Please sign the attached contract by Friday.',
                snippet: 'Please sign the attached...',
            },
            { apiKey: 'sk-test', useAI: true },
        );

        expect(result.alreadyProcessed).toBe(false);
        expect(result.classified).toBe(true);
    });

    it('falls back to snippet when body_text is null', async () => {
        const { extractEmailActions } =
            await import('@/features/inbox/lib/extractActions');
        vi.clearAllMocks();
        (extractEmailActions as ReturnType<typeof vi.fn>).mockResolvedValue(
            new Map(),
        );

        const db = makeDb(false);
        const result = await processEmail(
            db as never,
            {
                userId: 'u4',
                provider: 'outlook',
                emailId: 'outlook:def456',
                subject: 'Reminder',
                sender: 'noreply@corp.com',
                snippet: "Don't forget your meeting at 10am",
            },
            { apiKey: 'sk-test', useAI: true },
        );

        expect(result.alreadyProcessed).toBe(false);
        // Should have called extractEmailActions with snippet as body
        expect(extractEmailActions).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'outlook:def456',
                    body: expect.stringContaining('meeting'),
                }),
            ]),
            expect.any(Object),
        );
    });

    it('is idempotent for Outlook emails', async () => {
        const db = makeDb(true);
        const result = await processEmail(
            db as never,
            {
                userId: 'u5',
                provider: 'outlook',
                emailId: 'outlook:ghi789',
            },
            { apiKey: 'sk-test', useAI: true },
        );

        expect(result.alreadyProcessed).toBe(true);
    });

    it('Outlook IDs are prefixed differently from Gmail IDs', () => {
        const msgId = 'AAABBBCCC';
        expect(`outlook:${msgId}`).not.toBe(`gmail:${msgId}`);
        expect(`outlook:${msgId}`).toMatch(/^outlook:/);
        expect(`gmail:${msgId}`).toMatch(/^gmail:/);
    });
});

// ── Batch processing ──────────────────────────────────────────────────────────

describe('processBatch', () => {
    beforeEach(() => vi.clearAllMocks());

    it('tallies processed, failed, and skipped correctly', async () => {
        // Simulate: first item new, second already processed
        let callCount = 0;
        const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockImplementation(() => {
                callCount++;
                return Promise.resolve(
                    callCount === 1
                        ? { data: null }
                        : { data: { email_id: 'x' } },
                );
            }),
            upsert: vi.fn().mockResolvedValue({ error: null }),
        };
        const db = { from: vi.fn().mockReturnValue(chain) };

        const { extractEmailActions } =
            await import('@/features/inbox/lib/extractActions');
        (extractEmailActions as ReturnType<typeof vi.fn>).mockResolvedValue(
            new Map(),
        );

        const inputs = [
            { userId: 'u', provider: 'gmail' as const, emailId: 'gmail:new-1' },
            {
                userId: 'u',
                provider: 'gmail' as const,
                emailId: 'gmail:done-1',
            },
        ];

        const result = await processBatch(db as never, inputs, {
            apiKey: 'sk-test',
            useAI: true,
        });

        expect(result.processed).toBe(1);
        expect(result.skipped).toBe(1);
        expect(result.failed).toBe(0);
    });
});
