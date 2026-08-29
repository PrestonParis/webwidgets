import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    DurableJobRecord,
    JobFailure,
    JsonValue,
    V1JobEnvelope,
} from './contracts.js';

export interface DurableJobStore {
    get(jobId: string, userId: string): Promise<DurableJobRecord | null>;
    claim(job: V1JobEnvelope, attempt: number): Promise<boolean>;
    markRetry(
        job: V1JobEnvelope,
        attempt: number,
        failure: JobFailure,
    ): Promise<void>;
    markCompleted(job: V1JobEnvelope, result: JsonValue): Promise<void>;
    markDeadLettered(
        job: V1JobEnvelope,
        attempt: number,
        failure: JobFailure,
    ): Promise<void>;
    checkConnection(): Promise<boolean>;
}

interface JobRow {
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

function mapJob(row: JobRow): DurableJobRecord {
    return {
        id: row.id,
        userId: row.user_id,
        status: row.status,
        idempotencyKey: row.idempotency_key,
        correlationId: row.correlation_id,
        queueName: row.queue_name,
        queueJobId: row.queue_job_id,
        retryCount: row.retry_count,
        maxAttempts: row.max_attempts,
    };
}

function expiresAt(days: number) {
    return new Date(Date.now() + days * 86_400_000).toISOString();
}

export class SupabaseJobStore implements DurableJobStore {
    constructor(
        private readonly client: SupabaseClient,
        private readonly claimLeaseMs = 150_000,
    ) {}

    async get(jobId: string, userId: string) {
        const result = await this.client
            .from('jobs')
            .select(
                'id,user_id,status,idempotency_key,correlation_id,queue_name,queue_job_id,retry_count,max_attempts',
            )
            .eq('id', jobId)
            .eq('user_id', userId)
            .maybeSingle();
        if (result.error) throw new Error('Canonical job lookup failed');
        return result.data ? mapJob(result.data as JobRow) : null;
    }

    async claim(job: V1JobEnvelope, attempt: number) {
        const staleBefore = new Date(
            Date.now() - this.claimLeaseMs,
        ).toISOString();
        const result = await this.client
            .from('jobs')
            .update({
                status: 'running',
                started_at: new Date().toISOString(),
                retry_count: Math.max(0, attempt - 1),
                failure_code: null,
                failure_detail: null,
            })
            .eq('id', job.jobId)
            .eq('user_id', job.userId)
            .or(
                `status.eq.queued,and(status.eq.running,started_at.lt.${staleBefore})`,
            )
            .select('id')
            .maybeSingle();
        if (result.error) throw new Error('Canonical job claim failed');
        return result.data !== null;
    }

    async markRetry(job: V1JobEnvelope, attempt: number, failure: JobFailure) {
        await this.update(job, {
            status: 'queued',
            retry_count: attempt,
            failure_code: failure.code,
            failure_detail: failure.detail,
            available_at: new Date().toISOString(),
            diagnostics_expires_at: expiresAt(90),
        });
        await this.markActionRetry(job, failure);
    }

    async markCompleted(job: V1JobEnvelope, result: JsonValue) {
        await this.update(job, {
            status: 'completed',
            completed_at: new Date().toISOString(),
            user_visible_result: result,
            diagnostics_expires_at: expiresAt(30),
            failure_code: null,
            failure_detail: null,
        });
    }

    async markDeadLettered(
        job: V1JobEnvelope,
        attempt: number,
        failure: JobFailure,
    ) {
        const now = new Date().toISOString();
        await this.update(job, {
            status: 'dead_lettered',
            retry_count: attempt,
            dead_lettered_at: now,
            completed_at: now,
            failure_code: failure.code,
            failure_detail: failure.detail,
            diagnostics_expires_at: expiresAt(90),
        });
        if (job.task.kind === 'briefing.generate') {
            await this.client
                .from('briefings')
                .update({
                    status: 'failed',
                    generated_at: now,
                    failure_code: failure.code,
                    failure_detail: failure.detail,
                })
                .eq('user_id', job.userId)
                .eq('idempotency_key', job.idempotencyKey)
                .in('status', ['queued', 'generating']);
        }
        if (job.task.kind === 'action.execute') {
            await this.markActionFailed(job, attempt, failure, now);
        }
    }

    async checkConnection() {
        const result = await this.client.from('jobs').select('id').limit(1);
        return result.error === null;
    }

    private async update(job: V1JobEnvelope, values: Record<string, unknown>) {
        const result = await this.client
            .from('jobs')
            .update(values)
            .eq('id', job.jobId)
            .eq('user_id', job.userId);
        if (result.error) throw new Error('Canonical job transition failed');
    }

    private async markActionRetry(job: V1JobEnvelope, failure: JobFailure) {
        if (job.task.kind !== 'action.execute') return;
        const result = await this.client
            .from('action_requests')
            .update({
                status: 'queued',
                failure_code: failure.code,
                failure_detail: failure.detail,
            })
            .eq('id', job.task.actionRequestId)
            .eq('user_id', job.userId)
            .not(
                'action_id',
                'in',
                '(email.draft,email.send,calendar.create_event,automation.run)',
            )
            .neq('status', 'completed');
        if (result.error) throw new Error('Action retry transition failed');
    }

    private async markActionFailed(
        job: V1JobEnvelope,
        attempt: number,
        failure: JobFailure,
        completedAt: string,
    ) {
        if (job.task.kind !== 'action.execute') return;
        const request = await this.client
            .from('action_requests')
            .update({
                status: 'failed',
                failure_code: failure.code,
                failure_detail: failure.detail,
                execution_completed_at: completedAt,
            })
            .eq('id', job.task.actionRequestId)
            .eq('user_id', job.userId)
            .not(
                'action_id',
                'in',
                '(email.draft,email.send,calendar.create_event,automation.run)',
            )
            .neq('status', 'completed')
            .select('candidate_action_id')
            .maybeSingle();
        if (request.error) throw new Error('Action failure transition failed');
        if (!request.data) return;
        const outcome = await this.client.from('action_results').upsert(
            {
                user_id: job.userId,
                action_request_id: job.task.actionRequestId,
                job_id: job.jobId,
                idempotency_key: `task-failure:${job.task.actionRequestId}:${job.jobId}:${attempt}`,
                attempt,
                status: 'failed',
                result_hash: `failed:${job.jobId}`,
                ok: false,
                message: failure.detail,
                failure_code: failure.code,
                failure_detail: failure.detail,
                verification_status: 'unverifiable',
                undo_status: 'not_available',
                completed_at: completedAt,
            },
            { onConflict: 'user_id,idempotency_key', ignoreDuplicates: true },
        );
        if (outcome.error) throw new Error('Action failure outcome failed');
        if (request.data.candidate_action_id) {
            const candidate = await this.client
                .from('candidate_actions')
                .update({ state: 'failed' })
                .eq('id', request.data.candidate_action_id)
                .eq('user_id', job.userId);
            if (candidate.error)
                throw new Error('Action candidate failure transition failed');
        }
    }
}
