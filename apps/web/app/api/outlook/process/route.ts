/**
 * Outlook background processing — mirrors /api/gmail/process.
 *
 * Called by Vercel Cron every 10 minutes (configured in vercel.json).
 * Finds Outlook snapshots that have not been processed, runs the shared
 * extraction pipeline, and stores results.
 *
 * Authorization: Bearer CRON_SECRET  (Vercel injects this automatically for
 * cron invocations; manual calls must provide it as well).
 *
 * Also accepts user-authenticated requests for manual / debug use.
 */
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/adminClient';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import {
    processBatch,
    type ExtractionInput,
} from '@/features/inbox/server/emailExtractionService';
import { getLogger } from '@/lib/observability/logger';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { EmailSnapshotRow } from '@/features/inbox/types/inbox';

const BATCH_SIZE = 20;

// ── Fetch unprocessed Outlook snapshots ───────────────────────────────────────

async function getUnprocessedOutlookSnapshots(
    supabase: SupabaseClient,
    userId: string,
): Promise<EmailSnapshotRow[]> {
    const { data: snapshots } = await supabase
        .from('email_snapshots')
        .select(
            'id, user_id, account_email, provider, subject, sender_email, sender_name, snippet, body_text, received_at, raw_date, synced_at',
        )
        .eq('user_id', userId)
        .eq('provider', 'outlook')
        .order('received_at', { ascending: false })
        .limit(BATCH_SIZE * 3);

    if (!snapshots?.length) return [];

    const snapshotIds = (snapshots as EmailSnapshotRow[]).map((s) => s.id);
    const { data: logs } = await supabase
        .from('email_processing_log')
        .select('email_id')
        .eq('user_id', userId)
        .in('email_id', snapshotIds);

    const done = new Set(
        ((logs ?? []) as { email_id: string }[]).map((r) => r.email_id),
    );
    return (snapshots as EmailSnapshotRow[])
        .filter((s) => !done.has(s.id))
        .slice(0, BATCH_SIZE);
}

// ── Per-user processor ────────────────────────────────────────────────────────

async function processForUser(
    supabase: SupabaseClient,
    userId: string,
    log: ReturnType<typeof getLogger>,
): Promise<{ processed: number; failed: number }> {
    const { data: rawProfile } = await supabase
        .from('profiles')
        .select('use_ai_email, anthropic_api_key')
        .eq('id', userId)
        .maybeSingle();
    const profile = rawProfile as {
        use_ai_email: boolean;
        anthropic_api_key: string | null;
    } | null;
    const apiKey =
        profile?.anthropic_api_key ||
        process.env.ANTHROPIC_API_KEY ||
        undefined;

    const snapshots = await getUnprocessedOutlookSnapshots(supabase, userId);
    if (snapshots.length === 0) return { processed: 0, failed: 0 };

    log.info(
        { userId, count: snapshots.length },
        'Processing Outlook snapshots',
    );

    const inputs: ExtractionInput[] = snapshots.map((s) => {
        const sender = s.sender_name
            ? `${s.sender_name} <${s.sender_email}>`
            : s.sender_email;
        const input: ExtractionInput = {
            userId,
            provider: 'outlook',
            emailId: s.id,
            subject: s.subject,
            sender,
            snippet: s.snippet,
            receivedAt: s.received_at,
        };
        if (s.body_text != null) input.bodyText = s.body_text;
        return input;
    });

    const opts = {
        useAI: profile?.use_ai_email ?? true,
        ...(apiKey !== undefined ? { apiKey } : {}),
    };
    const result = await processBatch(supabase, inputs, opts);

    return { processed: result.processed, failed: result.failed };
}

// ── Route handlers ────────────────────────────────────────────────────────────

export async function POST(req: Request): Promise<Response> {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const log = getLogger({ operation: 'POST /api/outlook/process' });

    // Cron mode — processes all users with unprocessed Outlook snapshots
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        const supabase = createAdminClient();

        // Query only users who have snapshots not yet in processing_log
        const { data: userRows } = await supabase
            .from('email_snapshots')
            .select('user_id')
            .eq('provider', 'outlook')
            .limit(200);

        const userIds = [
            ...new Set(
                ((userRows ?? []) as { user_id: string }[]).map(
                    (r) => r.user_id,
                ),
            ),
        ];

        let totalProcessed = 0;
        let totalFailed = 0;

        for (const userId of userIds) {
            const result = await processForUser(supabase, userId, log);
            totalProcessed += result.processed;
            totalFailed += result.failed;
        }

        log.info(
            { totalProcessed, totalFailed, users: userIds.length },
            'Outlook cron complete',
        );
        return NextResponse.json({
            ok: true,
            processed: totalProcessed,
            failed: totalFailed,
        });
    }

    // User-authenticated mode
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);
    const result = await processForUser(supabaseAdmin, user.id, log);
    return NextResponse.json({ ok: true, ...result });
}
