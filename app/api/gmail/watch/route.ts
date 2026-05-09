import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';

// Register Gmail push notifications for the authenticated user.
// Requires GMAIL_PUBSUB_TOPIC env var pointing to a Cloud Pub/Sub topic
// that has a push subscription aimed at /api/gmail/webhook?token=<secret>.
export async function POST(): Promise<Response> {
    const topicName = process.env.GMAIL_PUBSUB_TOPIC;
    if (!topicName) {
        return NextResponse.json(
            { error: 'GMAIL_PUBSUB_TOPIC not configured' },
            { status: 500 },
        );
    }

    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    const tokens = await getGoogleTokens(supabaseAdmin, user.id);
    const auth = createGmailClient(tokens);
    await auth.getAccessToken();
    const gmail = google.gmail({ version: 'v1', auth });

    const { data: watch } = await gmail.users.watch({
        userId: 'me',
        requestBody: {
            topicName,
            labelIds: ['INBOX'],
        },
    });

    const profile = await supabase.auth.getUser();
    const gmailEmail = profile.data.user?.email ?? '';

    await supabaseAdmin
        .from('user_tokens')
        .update({
            last_history_id: watch.historyId ?? null,
            gmail_email: gmailEmail,
            watch_expiry: watch.expiration
                ? new Date(Number(watch.expiration)).toISOString()
                : null,
        })
        .eq('user_id', user.id);

    return NextResponse.json({ ok: true, expiry: watch.expiration });
}

// Stop Gmail push notifications for the authenticated user.
export async function DELETE(): Promise<Response> {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    const tokens = await getGoogleTokens(supabaseAdmin, user.id);
    const auth = createGmailClient(tokens);
    await auth.getAccessToken();
    const gmail = google.gmail({ version: 'v1', auth });

    await gmail.users.stop({ userId: 'me' });

    await supabaseAdmin
        .from('user_tokens')
        .update({ watch_expiry: null, gmail_email: null })
        .eq('user_id', user.id);

    return NextResponse.json({ ok: true });
}
