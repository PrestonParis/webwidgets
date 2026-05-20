import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchGmailSummary } from '@/lib/connectors/google/gmailConnector';
import { fetchOutlookMessages } from '@/lib/connectors/microsoft/graphConnector';
import { getMicrosoftTokens } from '@/lib/supabase/getMicrosoftTokens';
import { isNotConfigured } from '@/lib/connectors/providerError';
import type {
    InboxSummary,
    NormalizedMessage,
} from '@/features/inbox/schemas/inboxSchemas';

async function getGmailMessages(
    supabaseAdmin: SupabaseClient,
    userId: string,
    limit: number,
): Promise<{
    messages: NormalizedMessage[];
    unread: number;
    connected: boolean;
}> {
    try {
        const summary = await fetchGmailSummary(supabaseAdmin, userId, limit);
        return {
            messages: summary.messages.map((m) => ({
                id: m.id,
                provider: 'gmail' as const,
                subject: m.subject,
                from: m.from,
                snippet: m.snippet,
                date: m.date,
                isRead: m.isRead,
                threadId: m.threadId,
                actionCount: 0,
            })),
            unread: summary.unreadCount,
            connected: true,
        };
    } catch (err) {
        if (isNotConfigured(err))
            return { messages: [], unread: 0, connected: false };
        throw err;
    }
}

async function getOutlookMessages(
    supabaseAdmin: SupabaseClient,
    userId: string,
    limit: number,
): Promise<{
    messages: NormalizedMessage[];
    unread: number;
    connected: boolean;
}> {
    try {
        const tokens = await getMicrosoftTokens(supabaseAdmin, userId);
        const raw = await fetchOutlookMessages(tokens, limit);
        const messages: NormalizedMessage[] = raw.map((m) => ({
            id: m.id,
            provider: 'outlook' as const,
            subject: m.subject ?? '(no subject)',
            from: m.from
                ? `${m.from.emailAddress.name} <${m.from.emailAddress.address}>`
                : '',
            snippet: m.bodyPreview,
            date: m.receivedDateTime,
            isRead: m.isRead,
            threadId: undefined,
            actionCount: 0,
        }));
        return {
            messages,
            unread: messages.filter((m) => !m.isRead).length,
            connected: true,
        };
    } catch (err) {
        if (isNotConfigured(err))
            return { messages: [], unread: 0, connected: false };
        throw err;
    }
}

export async function getInboxSummary(
    supabaseAdmin: SupabaseClient,
    userId: string,
    limit = 10,
): Promise<InboxSummary> {
    const [gmail, outlook] = await Promise.all([
        getGmailMessages(supabaseAdmin, userId, limit),
        getOutlookMessages(supabaseAdmin, userId, limit),
    ]);

    const connectedProviders: string[] = [
        ...(gmail.connected ? ['gmail'] : []),
        ...(outlook.connected ? ['outlook'] : []),
    ];

    const all = [...gmail.messages, ...outlook.messages].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return {
        messages: all.slice(0, limit),
        unreadCount: gmail.unread + outlook.unread,
        connectedProviders,
    };
}
