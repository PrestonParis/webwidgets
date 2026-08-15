import type { RuntimeLogger } from '../logger.js';
import {
    TERMINAL_JOB_STATUSES,
    V1_QUEUE_NAMES,
    type DurableJobRecord,
    type JsonValue,
    type V1JobEnvelope,
} from './contracts.js';
import type { DurableJobStore } from './jobStore.js';
import {
    safeFailure,
    type ProcessorRegistry,
    WorkerTaskError,
} from './processors.js';

interface DeliveryContext {
    attempt: number;
    queueJobId: string;
}

interface JobRunnerDependencies {
    store: DurableJobStore;
    processors: ProcessorRegistry;
    logger: RuntimeLogger;
    dryRun: boolean;
    timeoutMs: number;
}

export interface JobRunResult {
    disposition: 'completed' | 'duplicate';
    result?: JsonValue;
}

function terminal(job: DurableJobRecord) {
    return TERMINAL_JOB_STATUSES.includes(
        job.status as (typeof TERMINAL_JOB_STATUSES)[number],
    );
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(
            () =>
                reject(
                    new WorkerTaskError(
                        'job_timeout',
                        'Processor exceeded its execution timeout.',
                        true,
                    ),
                ),
            timeoutMs,
        );
    });
    try {
        return await Promise.race([promise, timeout]);
    } finally {
        if (timer) clearTimeout(timer);
    }
}

function assertIdentity(job: DurableJobRecord, envelope: V1JobEnvelope) {
    const matches =
        job.idempotencyKey === envelope.idempotencyKey &&
        job.correlationId === envelope.correlationId &&
        job.queueName === V1_QUEUE_NAMES[envelope.queue] &&
        job.queueJobId === envelope.jobId;
    if (!matches) {
        throw new WorkerTaskError(
            'job_identity_mismatch',
            'Queue delivery does not match its canonical job receipt.',
            false,
        );
    }
}

export function createJobRunner(dependencies: JobRunnerDependencies) {
    return async function run(
        envelope: V1JobEnvelope,
        delivery: DeliveryContext,
    ): Promise<JobRunResult> {
        if (delivery.queueJobId !== envelope.jobId) {
            throw new WorkerTaskError(
                'queue_job_identity_mismatch',
                'BullMQ delivery does not match the canonical job identifier.',
                false,
            );
        }
        const canonical = await dependencies.store.get(
            envelope.jobId,
            envelope.userId,
        );
        if (!canonical) {
            throw new WorkerTaskError(
                'canonical_job_missing',
                'Queue delivery has no canonical job receipt.',
                false,
            );
        }
        assertIdentity(canonical, envelope);
        if (terminal(canonical)) return { disposition: 'duplicate' };
        const claimed = await dependencies.store.claim(
            envelope,
            delivery.attempt,
        );
        if (!claimed) return handleLostClaim(dependencies.store, envelope);
        try {
            const result = await withTimeout(
                dependencies.processors.execute(envelope.task, {
                    envelope,
                    dryRun: dependencies.dryRun,
                }),
                dependencies.timeoutMs,
            );
            await dependencies.store.markCompleted(envelope, result);
            dependencies.logger.info('canonical job completed', {
                jobId: envelope.jobId,
                userId: envelope.userId,
                correlationId: envelope.correlationId,
                queue: envelope.queue,
            });
            return { disposition: 'completed', result };
        } catch (error) {
            const failure = safeFailure(error);
            const exhausted = delivery.attempt >= canonical.maxAttempts;
            if (!failure.retryable || exhausted) {
                await dependencies.store.markDeadLettered(
                    envelope,
                    delivery.attempt,
                    failure,
                );
            } else {
                await dependencies.store.markRetry(
                    envelope,
                    delivery.attempt,
                    failure,
                );
            }
            dependencies.logger.warn('canonical job attempt failed', {
                jobId: envelope.jobId,
                userId: envelope.userId,
                correlationId: envelope.correlationId,
                queue: envelope.queue,
                failureCode: failure.code,
                attempt: delivery.attempt,
                deadLettered: !failure.retryable || exhausted,
            });
            throw new WorkerTaskError(
                failure.code,
                failure.detail,
                failure.retryable && !exhausted,
            );
        }
    };
}

async function handleLostClaim(
    store: DurableJobStore,
    envelope: V1JobEnvelope,
): Promise<JobRunResult> {
    const latest = await store.get(envelope.jobId, envelope.userId);
    if (latest && terminal(latest)) return { disposition: 'duplicate' };
    throw new WorkerTaskError(
        'job_claim_conflict',
        'Canonical job is already claimed by another delivery.',
        true,
    );
}
