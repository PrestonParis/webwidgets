/**
 * Gmail watch auto-renewal cron endpoint.
 *
 * Called by a scheduled job (e.g. Vercel Cron or external cron) once per day.
 * Renews Gmail Pub/Sub watches for all users whose watch_expiry is within
 * the next 24 hours (or already expired), so the push pipeline never goes dark.
 *
 * Authorization: Bearer CRON_SECRET
 */
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import { getLogger } from '@/lib/observability/logger';

const RENEW_WINDOW_MS = 24 * 60 * 60 * 1000; // renew watches expiring within 24 h

export async function POST(req: Request): Promise<Response> {
    const cronSecret = process.env.CRON_SECRET;
    const auth = req.headers.get('authorization');
    if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const topicName = process.env.GMAIL_PUBSUB_TOPIC;
    if (!topicName) {
        return NextResponse.json(
            { error: 'GMAIL_PUBSUB_TOPIC not configured' },
            { status: 500 },
        );
    }

    const supabase = createAdminClient();
    const log = getLogger({ operation: 'gmail.renew-watch' });

    const cutoff = new Date(Date.now() + RENEW_WINDOW_MS).toISOString();

    // Find all users with a watch expiring soon or already expired (or never set)
    const { data: rows, error } = await supabase
        .from('user_tokens')
        .select('user_id, watch_expiry, gmail_email')
        .or(`watch_expiry.is.null,watch_expiry.lt.${cutoff}`)
        .not('access_token', 'is', null);

    if (error) {
        log.error(
            { err: error },
            'Failed to query user_tokens for watch renewal',
        );
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const users = (rows ?? []) as {
        user_id: string;
        watch_expiry: string | null;
        gmail_email: string | null;
    }[];

    log.info({ count: users.length }, 'Renewing watches');

    let renewed = 0;
    let failed = 0;

    for (const user of users) {
        try {
            const tokens = await getGoogleTokens(supabase, user.user_id);
            const gmailAuth = createGmailClient(tokens);
            await gmailAuth.getAccessToken();
            const gmail = google.gmail({ version: 'v1', auth: gmailAuth });

            const { data: watch } = await gmail.users.watch({
                userId: 'me',
                requestBody: { topicName, labelIds: ['INBOX'] },
            });

            await supabase
                .from('user_tokens')
                .update({
                    last_history_id: watch.historyId ?? null,
                    watch_expiry: watch.expiration
                        ? new Date(Number(watch.expiration)).toISOString()
                        : null,
                })
                .eq('user_id', user.user_id);

            log.info(
                { userId: user.user_id, expiry: watch.expiration },
                'Watch renewed',
            );
            renewed++;
        } catch (err) {
            log.error({ err, userId: user.user_id }, 'Watch renewal failed');
            failed++;
        }
    }

    return NextResponse.json({ ok: true, renewed, failed });
}
