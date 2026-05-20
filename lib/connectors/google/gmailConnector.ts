import { google } from 'googleapis';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import { ProviderError } from '@/lib/connectors/providerError';

export const gmailMessageSchema = z.object({
    id: z.string(),
    threadId: z.string(),
    subject: z.string(),
    from: z.string(),
    snippet: z.string(),
    date: z.string(),
    isRead: z.boolean(),
});

export type GmailMessage = z.infer<typeof gmailMessageSchema>;

export const gmailSummarySchema = z.object({
    messages: z.array(gmailMessageSchema),
    unreadCount: z.number(),
    nextPageToken: z.string().optional(),
});

export type GmailSummary = z.infer<typeof gmailSummarySchema>;

async function buildGmailClient(supabaseAdmin: SupabaseClient, userId: string) {
    const { data: tokenRow } = await supabaseAdmin
        .from('user_tokens')
        .select('access_token')
        .eq('user_id', userId)
        .maybeSingle();

    if (!tokenRow?.access_token) {
        throw new ProviderError(
            'PROVIDER_NOT_CONFIGURED',
            'Gmail not connected',
        );
    }

    const tokens = await getGoogleTokens(supabaseAdmin, userId);
    const auth = createGmailClient(tokens);
    return google.gmail({ version: 'v1', auth });
}

function parseHeader(
    headers: { name?: string | null; value?: string | null }[],
    name: string,
): string {
    return (
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())
            ?.value ?? ''
    );
}

export async function fetchGmailSummary(
    supabaseAdmin: SupabaseClient,
    userId: string,
    limit = 10,
): Promise<GmailSummary> {
    const gmail = await buildGmailClient(supabaseAdmin, userId);

    const listRes = await gmail.users.messages
        .list({
            userId: 'me',
            maxResults: limit,
            labelIds: ['INBOX'],
        })
        .catch(() => {
            throw new ProviderError(
                'PROVIDER_UNAVAILABLE',
                'Gmail unavailable',
            );
        });

    const messageIds = listRes.data.messages ?? [];
    if (messageIds.length === 0) {
        return { messages: [], unreadCount: 0 };
    }

    const details = await Promise.allSettled(
        messageIds
            .slice(0, limit)
            .map((msg) =>
                gmail.users.messages.get({
                    userId: 'me',
                    id: msg.id ?? '',
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From', 'Date'],
                }),
            ),
    );

    const messages: GmailMessage[] = details.flatMap((result) => {
        if (result.status !== 'fulfilled') return [];
        const msg = result.value.data;
        const headers = msg.payload?.headers ?? [];
        return [
            {
                id: msg.id ?? '',
                threadId: msg.threadId ?? '',
                subject: parseHeader(headers, 'Subject') || '(no subject)',
                from: parseHeader(headers, 'From'),
                snippet: msg.snippet ?? '',
                date: parseHeader(headers, 'Date'),
                isRead: !(msg.labelIds ?? []).includes('UNREAD'),
            },
        ];
    });

    const unreadCount = messages.filter((m) => !m.isRead).length;

    return gmailSummarySchema.parse({
        messages,
        unreadCount,
        nextPageToken: listRes.data.nextPageToken ?? undefined,
    });
}
