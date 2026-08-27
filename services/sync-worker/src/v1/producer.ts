import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../env.js';
import {
    V1_QUEUE_NAMES,
    type DurableJobRecord,
    type V1JobEnvelope,
    type V1QueueKind,
    type V1Task,
} from './contracts.js';
import { createV1Queue } from './queues.js';

interface EnqueueInput {
    userId: string;
    idempotencyKey: string;
    queue: V1QueueKind;
    task: V1Task;
    correlationId?: string;
    maxAttempts?: number;
}

interface InsertedJob {
    id: string;
    user_id: string;
    status: DurableJobRecord['status'];
    idempotency_key: string;
    correlation_id: string;
    queue_name: string;
    queue_job_id: string;
    retry_count: number;
    max_attempts: number;
}

async function findExisting(
    client: SupabaseClient,
    input: EnqueueInput,
): Promise<InsertedJob> {
    const result = await client
        .from('jobs')
        .select(
            'id,user_id,status,idempotency_key,correlation_id,queue_name,queue_job_id,retry_count,max_attempts',
        )
        .eq('user_id', input.userId)
        .eq('idempotency_key', input.idempotencyKey)
        .single();
    if (result.error) throw new Error('Canonical job lookup failed');
    return result.data as InsertedJob;
}

async function createCanonicalJob(client: SupabaseClient, input: EnqueueInput) {
    const id = randomUUID();
    const correlationId = input.correlationId ?? randomUUID();
    const result = await client
        .from('jobs')
        .insert({
            id,
            user_id: input.userId,
            type: input.task.kind,
            status: 'queued',
            idempotency_key: input.idempotencyKey,
            correlation_id: correlationId,
            queue_name: V1_QUEUE_NAMES[input.queue],
            queue_job_id: id,
            max_attempts: input.maxAttempts ?? 3,
            metadata: { task: input.task },
        })
        .select(
            'id,user_id,status,idempotency_key,correlation_id,queue_name,queue_job_id,retry_count,max_attempts',
        )
        .single();
    if (!result.error) return result.data as InsertedJob;
    if (result.error.code === '23505') return findExisting(client, input);
    throw new Error('Canonical job creation failed');
}

async function reviveRetryableActionJob(
    client: SupabaseClient,
    canonical: InsertedJob,
    input: EnqueueInput,
) {
    if (
        input.task.kind !== 'action.execute' ||
        !['failed', 'dead_lettered'].includes(canonical.status)
    ) {
        return canonical;
    }
    const result = await client
        .from('jobs')
        .update({
            status: 'queued',
            retry_count: 0,
            available_at: new Date().toISOString(),
            started_at: null,
            completed_at: null,
            dead_lettered_at: null,
            failure_code: null,
            failure_detail: null,
        })
        .eq('id', canonical.id)
        .eq('user_id', canonical.user_id)
        .in('status', ['failed', 'dead_lettered'])
        .select(
            'id,user_id,status,idempotency_key,correlation_id,queue_name,queue_job_id,retry_count,max_attempts',
        )
        .maybeSingle();
    if (result.error) throw new Error('Action job retry reset failed');
    return (result.data as InsertedJob | null) ?? canonical;
}

async function ensureBriefingReceipt(
    client: SupabaseClient,
    canonical: InsertedJob,
    input: EnqueueInput,
) {
    if (input.task.kind !== 'briefing.generate') return;
    const existing = await client
        .from('briefings')
        .select('id')
        .eq('user_id', input.userId)
        .eq('idempotency_key', input.idempotencyKey)
        .maybeSingle();
    if (existing.error) throw new Error('Briefing receipt lookup failed');
    if (existing.data) {
        const linked = await client
            .from('briefings')
            .update({ job_id: canonical.id })
            .eq('id', existing.data.id)
            .is('job_id', null);
        if (linked.error) throw new Error('Briefing receipt link failed');
        return;
    }
    const result = await client.from('briefings').insert({
        user_id: input.userId,
        job_id: canonical.id,
        idempotency_key: input.idempotencyKey,
        trigger_type: input.task.trigger,
        status: 'queued',
        covered_from: input.task.coveredFrom,
        covered_to: input.task.coveredTo,
        expires_at: new Date(
            Date.parse(input.task.coveredTo) + 48 * 3_600_000,
        ).toISOString(),
        rule_version: 'briefing-rank-v1',
    });
    if (result.error?.code === '23505') return;
    if (result.error) throw new Error('Briefing receipt creation failed');
}

async function linkActionRequest(
    client: SupabaseClient,
    canonical: InsertedJob,
    input: EnqueueInput,
) {
    if (input.task.kind !== 'action.execute') return;
    const result = await client
        .from('action_requests')
        .update({ job_id: canonical.id, status: 'queued' })
        .eq('id', input.task.actionRequestId)
        .eq('user_id', input.userId)
        .eq('approval_state', 'approved')
        .select('id')
        .maybeSingle();
    if (result.error || !result.data) {
        throw new Error('Approved action request link failed');
    }
}

export async function enqueueCanonicalJob(
    client: SupabaseClient,
    env: WorkerEnv,
    input: EnqueueInput,
) {
    const created = await createCanonicalJob(client, input);
    const canonical = await reviveRetryableActionJob(client, created, input);
    await ensureBriefingReceipt(client, canonical, input);
    await linkActionRequest(client, canonical, input);
    const envelope: V1JobEnvelope = {
        version: 1,
        jobId: canonical.id,
        userId: canonical.user_id,
        correlationId: canonical.correlation_id,
        idempotencyKey: canonical.idempotency_key,
        queue: input.queue,
        task: input.task,
    };
    const queue = createV1Queue(env, input.queue);
    try {
        const existing = await queue.getJob(canonical.queue_job_id);
        if (existing && (await existing.getState()) === 'failed') {
            await existing.remove();
        }
        await queue.add(input.task.kind, envelope, {
            jobId: canonical.queue_job_id,
            attempts: canonical.max_attempts,
        });
    } finally {
        await queue.close();
    }
    return canonical.id;
}
