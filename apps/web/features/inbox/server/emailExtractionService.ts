/**
 * Shared email extraction service.
 *
 * Both the Gmail queue pipeline and the Outlook background processor delegate
 * here so the classification + action-extraction + storage logic lives in
 * exactly one place.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { extractEmailActions } from '@/features/inbox/lib/extractActions';
import { routeInference } from '@/features/inbox/lib/modelRouter';
import type { EmailProvider } from '@/features/inbox/types/inbox';

export interface ExtractionInput {
    userId: string;
    provider: EmailProvider;
    emailId: string; // prefixed ("gmail:<id>" or "outlook:<id>")
    subject?: string;
    sender?: string; // "Name <email>" or just "email"
    bodyText?: string;
    snippet?: string;
    receivedAt?: string;
}

export interface ExtractionResult {
    classified: boolean;
    actionsStored: number;
    alreadyProcessed: boolean;
}

export interface ExtractionServiceOptions {
    apiKey?: string;
    useAI?: boolean;
}

// ── Idempotency ───────────────────────────────────────────────────────────────

async function isAlreadyProcessed(
    supabase: SupabaseClient,
    userId: string,
    emailId: string,
): Promise<boolean> {
    const { data } = await supabase
        .from('email_processing_log')
        .select('email_id')
        .eq('user_id', userId)
        .eq('email_id', emailId)
        .maybeSingle();
    return Boolean(data);
}

async function markProcessed(
    supabase: SupabaseClient,
    userId: string,
    emailId: string,
): Promise<void> {
    await supabase
        .from('email_processing_log')
        .upsert([{ user_id: userId, email_id: emailId }], {
            onConflict: 'user_id,email_id',
        });
}

// ── Classification ────────────────────────────────────────────────────────────

async function classifyEmail(
    supabase: SupabaseClient,
    input: ExtractionInput,
    opts: ExtractionServiceOptions,
): Promise<void> {
    const { userId, emailId, subject = '', sender = '' } = input;
    const categoryMap = await routeInference([{ idx: 0, sender, subject }], {
        allowHosted: !!opts.apiKey,
        ...(opts.apiKey ? { apiKey: opts.apiKey } : {}),
    });
    const category = categoryMap.get(0) ?? 'other';

    await supabase.from('email_classifications').upsert(
        [
            {
                user_id: userId,
                email_id: emailId,
                sender,
                subject,
                category,
                is_manual: false,
            },
        ],
        { onConflict: 'user_id,email_id', ignoreDuplicates: true },
    );
}

// ── Action extraction + storage ───────────────────────────────────────────────

async function extractAndStore(
    supabase: SupabaseClient,
    input: ExtractionInput,
    opts: ExtractionServiceOptions,
): Promise<number> {
    const { userId, emailId, subject = '', sender = '', receivedAt } = input;
    const body = input.bodyText ?? input.snippet ?? '';

    const actionsMap = await extractEmailActions(
        [
            {
                id: emailId,
                sender,
                subject,
                snippet: body.slice(0, 500),
                body: body.slice(0, 6000),
                ...(receivedAt ? { date: receivedAt } : {}),
            },
        ],
        { ...(opts.apiKey ? { apiKey: opts.apiKey } : {}) },
    );

    const rows = [];
    for (const [eid, actions] of actionsMap) {
        for (const a of actions) {
            rows.push({
                user_id: userId,
                email_id: eid,
                type: a.type,
                title: a.title,
                description: a.description,
                due_date: a.due_date,
                action_url: a.action_url,
            });
        }
    }

    if (rows.length > 0) {
        await supabase
            .from('email_actions')
            .upsert(rows, { onConflict: 'user_id,email_id,title' });
    }

    return rows.length;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Process one email: classify it, extract actions, mark as processed.
 *
 * Idempotent — re-running the same emailId for the same user is a no-op.
 * Classification failures are non-fatal; extraction failures propagate.
 */
export async function processEmail(
    supabase: SupabaseClient,
    input: ExtractionInput,
    opts: ExtractionServiceOptions = {},
): Promise<ExtractionResult> {
    const { userId, emailId } = input;
    const useAI = opts.useAI ?? true;

    if (await isAlreadyProcessed(supabase, userId, emailId)) {
        return { classified: false, actionsStored: 0, alreadyProcessed: true };
    }

    // Classification is non-fatal — a bad classifier response should not
    // prevent actions from being stored.
    let classified = false;
    try {
        await classifyEmail(supabase, input, opts);
        classified = true;
    } catch {
        // intentionally swallowed
    }

    let actionsStored = 0;
    if (useAI && opts.apiKey) {
        actionsStored = await extractAndStore(supabase, input, opts);
    }

    await markProcessed(supabase, userId, emailId);

    return { classified, actionsStored, alreadyProcessed: false };
}

/**
 * Process a batch of emails sequentially, collecting per-item outcomes.
 * Failures on individual items are caught so one bad email can't halt the batch.
 */
export async function processBatch(
    supabase: SupabaseClient,
    inputs: ExtractionInput[],
    opts: ExtractionServiceOptions = {},
): Promise<{ processed: number; failed: number; skipped: number }> {
    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const input of inputs) {
        try {
            const result = await processEmail(supabase, input, opts);
            if (result.alreadyProcessed) {
                skipped++;
            } else {
                processed++;
            }
        } catch {
            failed++;
        }
    }

    return { processed, failed, skipped };
}
