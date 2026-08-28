import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createCredentialClients as createClients } from '@/app/api/auth/_lib/credentialClients';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import {
    claimBatch,
    markDone,
    markFailed,
} from '@/features/inbox/lib/queueManager';
import { processQueueItem } from '@/features/inbox/lib/pipeline';
import { getLogger, runWithContext } from '@/lib/observability/logger';
import { captureError } from '@/lib/observability/sentry';
import { createAdminClient } from '@/lib/supabase/adminClient';

// Queue worker trigger.
// User-authenticated: drains queue items belonging to the requesting user.
// Cron mode (Authorization: Bearer CRON_SECRET): drains items across all users.
export async function POST(req: Request): Promise<Response> {
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');

    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        return runWithContext(
            { requestId, operation: 'POST /api/gmail/process (cron)' },
            processAll,
        );
    }

    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);
    return runWithContext(
        { requestId, userId: user.id, operation: 'POST /api/gmail/process' },
        () => processForUser(supabaseAdmin, user.id),
    );
}

async function processForUser(
    supabase: SupabaseClient,
    userId: string,
): Promise<Response> {
    const { data: rawProfile } = await supabase
        .from('profiles')
        .select('use_ai_email, anthropic_api_key')
        .eq('id', userId)
        .maybeSingle();
    const profile = rawProfile as {
        use_ai_email: boolean;
        anthropic_api_key: string | null;
    } | null;

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

    const log = getLogger({ feature: 'email-queue' });
    const items = await claimBatch(supabase, userId);
    log.info({ itemCount: items.length, userId }, 'Worker claimed batch');

    let processed = 0;
    let failed = 0;

    for (const item of items) {
        const itemStart = performance.now();
        try {
            // Use user's personal key first, fall back to server key so
            // extraction runs automatically for all users without manual setup.
            const apiKey =
                profile?.anthropic_api_key ||
                process.env.ANTHROPIC_API_KEY ||
                undefined;
            await processQueueItem(item, {
                gmail,
                supabase,
                userId,
                useAI: !!(profile?.use_ai_email ?? true),
                ...(apiKey ? { apiKey } : {}),
            });
            await markDone(supabase, item.id);
            processed++;
            log.info(
                {
                    messageId: item.message_id,
                    durationMs: Math.round(performance.now() - itemStart),
                },
                'Queue item processed',
            );
        } catch (err) {
            await markFailed(supabase, item, String(err));
            failed++;
            captureError(err, {
                userId,
                operation: 'processQueueItem',
                feature: 'email-queue',
                extra: { messageId: item.message_id, attempt: item.attempts },
            });
            log.error(
                {
                    err,
                    messageId: item.message_id,
                    durationMs: Math.round(performance.now() - itemStart),
                },
                'Queue item failed',
            );
        }
    }

    log.info({ processed, failed }, 'Worker batch complete');
    return NextResponse.json({ ok: true, processed, failed });
}

async function processAll(): Promise<Response> {
    const supabase = createAdminClient();

    const { data: pendingRows } = await supabase
        .from('email_queue')
        .select('user_id')
        .eq('status', 'pending')
        .limit(100);

    if (!pendingRows || pendingRows.length === 0) {
        return NextResponse.json({ ok: true, processed: 0, failed: 0 });
    }

    const userIds = [
        ...new Set(
            (pendingRows as { user_id: string }[]).map((r) => r.user_id),
        ),
    ];

    let totalProcessed = 0;
    let totalFailed = 0;

    const log = getLogger({ operation: 'processAll', feature: 'email-queue' });
    log.info({ userCount: userIds.length }, 'Cron worker starting');

    for (const userId of userIds) {
        try {
            const res = await processForUser(supabase, userId);
            const data = (await res.json()) as {
                processed: number;
                failed: number;
            };
            totalProcessed += data.processed;
            totalFailed += data.failed;
        } catch (err) {
            log.error({ err, userId }, 'User processing failed in cron run');
        }
    }

    return NextResponse.json({
        ok: true,
        processed: totalProcessed,
        failed: totalFailed,
    });
}
