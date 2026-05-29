import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/supabase', () => ({
    supabase: { from: vi.fn(), auth: { getUser: vi.fn() } },
    db: { from: vi.fn() },
}));

vi.mock('@/lib/supabase/getMicrosoftTokens', async () => {
    const { ProviderError } = await vi.importActual<
        typeof import('@/lib/connectors/providerError')
    >('@/lib/connectors/providerError');
    return {
        getMicrosoftTokens: vi
            .fn()
            .mockRejectedValue(
                new ProviderError(
                    'PROVIDER_NOT_CONFIGURED',
                    'Microsoft not connected',
                ),
            ),
    };
});

// Mock the connector so tests don't need real Google credentials
vi.mock('@/lib/connectors/google/gmailConnector', () => ({
    fetchGmailSummary: vi.fn().mockResolvedValue({
        messages: [
            {
                id: 'msg-1',
                threadId: 'thread-1',
                subject: 'Hello',
                from: 'alice@example.com',
                snippet: 'Hey there',
                date: 'Mon, 19 May 2026 10:00:00 +0000',
                isRead: false,
            },
        ],
        unreadCount: 1,
    }),
}));

vi.mock('@/lib/connectors/providerError', async (importOriginal) => {
    const original =
        await importOriginal<typeof import('@/lib/connectors/providerError')>();
    return original;
});

describe('inboxService', () => {
    it('normalizes Gmail messages and adds provider tag', async () => {
        const { getInboxSummary } =
            await import('@/features/inbox/server/inboxService');
        const fakeAdmin = {} as Parameters<typeof getInboxSummary>[0];

        const summary = await getInboxSummary(fakeAdmin, 'user-123', 10);

        expect(summary.messages).toHaveLength(1);
        expect(summary.messages[0]?.provider).toBe('gmail');
        expect(summary.messages[0]?.subject).toBe('Hello');
        expect(summary.unreadCount).toBe(1);
        expect(summary.connectedProviders).toContain('gmail');
    });

    it('returns empty inbox when gmail not configured', async () => {
        const { ProviderError } =
            await import('@/lib/connectors/providerError');
        const { fetchGmailSummary } =
            await import('@/lib/connectors/google/gmailConnector');
        vi.mocked(fetchGmailSummary).mockRejectedValueOnce(
            new ProviderError('PROVIDER_NOT_CONFIGURED', 'Gmail not connected'),
        );

        const { getInboxSummary } =
            await import('@/features/inbox/server/inboxService');
        const fakeAdmin = {} as Parameters<typeof getInboxSummary>[0];

        const summary = await getInboxSummary(fakeAdmin, 'user-123', 10);

        expect(summary.messages).toHaveLength(0);
        expect(summary.unreadCount).toBe(0);
        expect(summary.connectedProviders).toHaveLength(0);
    });
});
