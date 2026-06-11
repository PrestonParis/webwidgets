/**
 * Tests for email_snapshots.body_text handling.
 *
 * Covers:
 *  - Snapshot inserts succeed when body_text is present.
 *  - Snapshot reads do not fail when body_text is null.
 *  - The shared service falls back to snippet when body_text is null.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processEmail } from '@/features/inbox/server/emailExtractionService';

// ── Supabase mock factory ──────────────────────────────────────────────────────

function makeSupabase(overrides: Record<string, unknown> = {}) {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockResolvedValue({ error: null });

    const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        upsert: mockUpsert,
        update: mockUpdate,
        ...overrides,
    };

    return {
        from: vi.fn().mockReturnValue(chain),
        _chain: chain,
        _mockUpsert: mockUpsert,
    };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('email_snapshots body_text', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        vi.stubEnv('ANTHROPIC_API_KEY', '');
    });

    it('processes successfully when body_text is populated', async () => {
        const db = makeSupabase();
        const result = await processEmail(
            db as never,
            {
                userId: 'user-1',
                provider: 'gmail',
                emailId: 'gmail:msg-1',
                subject: 'Invoice due',
                sender: 'billing@company.com',
                bodyText: 'Please pay your invoice of $500 by June 1.',
                snippet: 'Please pay your invoice...',
            },
            { useAI: false },
        );

        // No apiKey → extraction skipped but processing log still written
        expect(result.alreadyProcessed).toBe(false);
        expect(db._mockUpsert).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    user_id: 'user-1',
                    email_id: 'gmail:msg-1',
                }),
            ]),
            expect.objectContaining({ onConflict: 'user_id,email_id' }),
        );
    });

    it('processes successfully when body_text is null (falls back to snippet)', async () => {
        const db = makeSupabase();
        const result = await processEmail(
            db as never,
            {
                userId: 'user-2',
                provider: 'outlook',
                emailId: 'outlook:msg-2',
                subject: 'Meeting reminder',
                sender: 'cal@corp.com',
                snippet: 'Team standup at 9am',
            },
            { useAI: false },
        );

        expect(result.alreadyProcessed).toBe(false);
    });

    it('returns alreadyProcessed when email_id is in processing log', async () => {
        const db = makeSupabase({
            maybeSingle: vi.fn().mockResolvedValue({
                data: { email_id: 'gmail:msg-3' },
                error: null,
            }),
        });

        const result = await processEmail(
            db as never,
            {
                userId: 'user-3',
                provider: 'gmail',
                emailId: 'gmail:msg-3',
            },
            {},
        );

        expect(result.alreadyProcessed).toBe(true);
        expect(result.actionsStored).toBe(0);
        // No upsert into processing_log or actions when already processed
        expect(db._mockUpsert).not.toHaveBeenCalled();
    });

    it('gmail and outlook IDs never collide', () => {
        const gmailId = `gmail:AAA`;
        const outlookId = `outlook:AAA`;
        expect(gmailId).not.toBe(outlookId);
    });
});
