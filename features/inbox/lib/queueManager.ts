import type { SupabaseClient } from '@supabase/supabase-js';
import type { NormalizedEmailEvent } from '@/features/inbox/types/events';
import { getLogger } from '@/lib/observability/logger';
import {
    emailQueueProcessed,
    emailQueueRetries,
    emailQueueDeadLettered,
} from '@/lib/observability/metrics';

export type QueueStage = 'ingest' | 'classify' | 'notify' | 'dead-letter';
export type QueueStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface QueueItem {
    id: string;
    user_id: string;
    message_id: string;
    thread_id: string | null;
    history_id: string | null;
    stage: QueueStage;
    priority: number;
    status: QueueStatus;
    payload: NormalizedEmailEvent | null;
    attempts: number;
    last_error: string | null;
    created_at: string;
    updated_at: string;
}

const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 10;

export async function enqueueMessages(
    supabase: SupabaseClient,
    userId: string,
    messages: Array<{
        message_id: string;
        thread_id: string;
        history_id: string;
    }>,
    priority = 0,
): Promise<void> {
    if (messages.length === 0) return;
    await supabase.from('email_queue').upsert(
        messages.map((m) => ({
            user_id: userId,
            message_id: m.message_id,
            thread_id: m.thread_id,
            history_id: m.history_id,
            priority,
            status: 'pending',
            stage: 'ingest',
        })),
        { onConflict: 'user_id,message_id', ignoreDuplicates: true },
    );
}

export async function claimBatch(
    supabase: SupabaseClient,
    userId?: string,
    limit = BATCH_SIZE,
): Promise<QueueItem[]> {
    let query = supabase
        .from('email_queue')
        .select('*')
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(limit);

    if (userId) query = query.eq('user_id', userId);

    const { data } = await query;
    if (!data || data.length === 0) return [];

    const ids = (data as QueueItem[]).map((r) => r.id);
    const { data: claimed } = await supabase
        .from('email_queue')
        .update({ status: 'processing', updated_at: new Date().toISOString() })
        .in('id', ids)
        .eq('status', 'pending')
        .select('*');

    return (claimed ?? []) as QueueItem[];
}

export async function markDone(
    supabase: SupabaseClient,
    id: string,
): Promise<void> {
    await supabase
        .from('email_queue')
        .update({ status: 'done', updated_at: new Date().toISOString() })
        .eq('id', id);
    emailQueueProcessed.inc({ status: 'done' });
}

export async function markFailed(
    supabase: SupabaseClient,
    item: QueueItem,
    error: string,
): Promise<void> {
    const log = getLogger({ operation: 'markFailed', feature: 'email-queue' });
    const attempts = item.attempts + 1;
    const nextStatus: QueueStatus =
        attempts >= MAX_ATTEMPTS ? 'failed' : 'pending';
    const nextStage: QueueStage =
        attempts >= MAX_ATTEMPTS ? 'dead-letter' : item.stage;

    await supabase
        .from('email_queue')
        .update({
            status: nextStatus,
            stage: nextStage,
            attempts,
            last_error: error,
            updated_at: new Date().toISOString(),
        })
        .eq('id', item.id);

    if (nextStage === 'dead-letter') {
        emailQueueDeadLettered.inc();
        emailQueueProcessed.inc({ status: 'dead-lettered' });
        log.error(
            { messageId: item.message_id, attempts, error },
            'Item moved to dead-letter',
        );
    } else {
        emailQueueRetries.inc();
        log.warn(
            { messageId: item.message_id, attempts, error },
            'Item queued for retry',
        );
    }
}
