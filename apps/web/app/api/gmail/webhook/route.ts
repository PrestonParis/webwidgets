import { NextResponse } from 'next/server';
import { gmail_v1, google } from 'googleapis';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import { enqueueMessages } from '@/features/inbox/lib/queueManager';

const pubSubSchema = z.object({
    message: z.object({
        data: z.string(),
        messageId: z.string(),
        publishTime: z.string(),
    }),
    subscription: z.string(),
});

const notificationSchema = z.object({
    emailAddress: z.string(),
    historyId: z.string(),
});

function parseNotification(
    data: string,
): z.infer<typeof notificationSchema> | null {
    try {
        const decoded = Buffer.from(data, 'base64').toString('utf-8');
        const result = notificationSchema.safeParse(JSON.parse(decoded));
        return result.success ? result.data : null;
    } catch {
        return null;
    }
}

function collectNewMessages(
    history: gmail_v1.Schema$ListHistoryResponse,
    historyId: string,
) {
    const newMessages: Array<{
        message_id: string;
        thread_id: string;
        history_id: string;
    }> = [];

    for (const record of history.history ?? []) {
        for (const added of record.messagesAdded ?? []) {
            if (added.message?.id && added.message?.threadId) {
                newMessages.push({
                    message_id: added.message.id,
                    thread_id: added.message.threadId,
                    history_id: historyId,
                });
            }
        }
    }
    return newMessages;
}

async function scheduleCanonicalSync(
    supabase: ReturnType<typeof createAdminClient>,
    userId: string,
    emailAddress: string,
) {
    const account = await supabase
        .from('user_email_accounts')
        .select('integration_connection_id')
        .eq('user_id', userId)
        .eq('provider', 'google')
        .ilike('email', emailAddress)
        .maybeSingle();
    const connectionId = account.data?.integration_connection_id as
        | string
        | null
        | undefined;
    if (!connectionId) return false;
    const scheduled = await supabase
        .from('integration_connections')
        .update({
            sync_status: 'scheduled',
            next_sync_at: new Date().toISOString(),
        })
        .eq('id', connectionId)
        .eq('user_id', userId)
        .is('disabled_at', null)
        .is('disconnected_at', null)
        .select('id')
        .maybeSingle();
    return Boolean(scheduled.data);
}

// Gmail sends Pub/Sub push messages to this endpoint.
// Validate via a shared token appended to the subscription push URL.
export async function POST(req: Request): Promise<Response> {
    const expectedToken = process.env.GMAIL_WEBHOOK_TOKEN;
    const receivedToken = new URL(req.url).searchParams.get('token');
    if (!expectedToken || receivedToken !== expectedToken) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body: unknown = await req.json();
    const parsed = pubSubSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const notification = parseNotification(parsed.data.message.data);
    if (!notification) {
        return NextResponse.json(
            { error: 'Bad message data' },
            { status: 400 },
        );
    }

    const supabase = createAdminClient();

    const { data: tokenRow } = await supabase
        .from('user_tokens')
        .select('user_id, last_history_id')
        .eq('gmail_email', notification.emailAddress)
        .maybeSingle();

    if (!tokenRow) {
        // Unknown user — ack to prevent Pub/Sub retry storm
        return NextResponse.json({ ok: true });
    }

    const userId = tokenRow.user_id as string;
    const lastHistoryId = tokenRow.last_history_id as string | null;
    await scheduleCanonicalSync(supabase, userId, notification.emailAddress);

    if (!lastHistoryId) {
        // First notification — seed the history cursor and wait for the next event
        await supabase
            .from('user_tokens')
            .update({ last_history_id: notification.historyId })
            .eq('user_id', userId);
        return NextResponse.json({ ok: true });
    }

    const tokens = await getGoogleTokens(supabase, userId);
    const auth = createGmailClient(tokens);
    auth.on('tokens', (fresh) => {
        if (fresh.access_token) {
            void supabase
                .from('user_tokens')
                .update({
                    access_token: fresh.access_token,
                    expires_at: fresh.expiry_date ?? Date.now() + 3590 * 1000,
                })
                .eq('user_id', userId);
        }
    });
    await auth.getAccessToken();
    const gmail = google.gmail({ version: 'v1', auth });

    const { data: history } = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: lastHistoryId,
        historyTypes: ['messageAdded'],
        labelId: 'INBOX',
    });

    const newMessages = collectNewMessages(history, notification.historyId);

    if (newMessages.length > 0) {
        await enqueueMessages(supabase, userId, newMessages);
    }

    await supabase
        .from('user_tokens')
        .update({ last_history_id: notification.historyId })
        .eq('user_id', userId);

    return NextResponse.json({ ok: true, enqueued: newMessages.length });
}
