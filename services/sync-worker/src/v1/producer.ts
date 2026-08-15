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

export async function enqueueCanonicalJob(
    client: SupabaseClient,
    env: WorkerEnv,
    input: EnqueueInput,
) {
    const canonical = await createCanonicalJob(client, input);
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
        await queue.add(input.task.kind, envelope, {
            jobId: canonical.queue_job_id,
            attempts: canonical.max_attempts,
        });
    } finally {
        await queue.close();
    }
    return canonical.id;
}
