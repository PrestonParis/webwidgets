import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import { fetchEmailBatch } from '@/features/inbox/hooks/useFetchEmails';
import { enqueueMessages } from '@/features/inbox/lib/queueManager';
import { createAdminClient } from '@/lib/supabase/adminClient';

// Polling fallback: enqueues recent inbox messages for background processing.
// Called on a cron schedule or as a recovery mechanism when watch expires.
// Cron mode (Authorization: Bearer CRON_SECRET): processes all users with
// expired or missing watches.
export async function POST(req: Request): Promise<Response> {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        return pollAllUsers();
    }

    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);
    return pollUser(supabaseAdmin, user.id);
}

async function pollUser(
    supabase: SupabaseClient,
    userId: string,
): Promise<Response> {
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

    const { ids } = await fetchEmailBatch(gmail, undefined);
    if (ids.length === 0) return NextResponse.json({ ok: true, enqueued: 0 });

    const { data: existing } = await supabase
        .from('email_queue')
        .select('message_id')
        .eq('user_id', userId)
        .in('message_id', ids);

    const existingIds = new Set(
        ((existing ?? []) as { message_id: string }[]).map((r) => r.message_id),
    );
    const toEnqueue = ids.filter((id) => !existingIds.has(id));
    if (toEnqueue.length === 0)
        return NextResponse.json({ ok: true, enqueued: 0 });

    const msgs = await Promise.all(
        toEnqueue.map((id) =>
            gmail.users.messages.get({ userId: 'me', id, format: 'minimal' }),
        ),
    );

    const messages = msgs
        .filter((r) => r.data.id && r.data.threadId)
        .map((r) => ({
            message_id: r.data.id!,
            thread_id: r.data.threadId!,
            history_id: '',
        }));

    await enqueueMessages(supabase, userId, messages);
    return NextResponse.json({ ok: true, enqueued: messages.length });
}

async function pollAllUsers(): Promise<Response> {
    const supabase = createAdminClient();

    const now = new Date().toISOString();
    const { data: rows } = await supabase
        .from('user_tokens')
        .select('user_id')
        .or(`watch_expiry.is.null,watch_expiry.lt.${now}`);

    if (!rows || rows.length === 0) {
        return NextResponse.json({ ok: true, polled: 0 });
    }

    let polled = 0;
    for (const row of rows as { user_id: string }[]) {
        try {
            await pollUser(supabase, row.user_id);
            polled++;
        } catch {
            // Skip failed users; next cron tick retries
        }
    }

    return NextResponse.json({ ok: true, polled });
}
