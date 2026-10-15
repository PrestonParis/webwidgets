import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import type { RuntimeLogger } from '../logger.js';
import type {
    DurableJobRecord,
    JobFailure,
    JsonValue,
    V1JobEnvelope,
} from '../v1/contracts.js';
import { createJobRunner } from '../v1/jobRunner.js';
import type { DurableJobStore } from '../v1/jobStore.js';
import { createProcessorRegistry, WorkerTaskError } from '../v1/processors.js';

const envelope: V1JobEnvelope = {
    version: 1,
    jobId: '10000000-0000-4000-8000-000000000001',
    userId: '20000000-0000-4000-8000-000000000001',
    correlationId: 'phase-5-test',
    idempotencyKey: 'runtime-probe:phase-5',
    queue: 'schedule',
    task: { kind: 'runtime.probe' },
};

const silentLogger: RuntimeLogger = {
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
};

class MemoryJobStore implements DurableJobStore {
    job: DurableJobRecord = {
        id: envelope.jobId,
        userId: envelope.userId,
        status: 'queued',
        idempotencyKey: envelope.idempotencyKey,
        correlationId: envelope.correlationId,
        queueName: 'v1-schedule',
        queueJobId: envelope.jobId,
        retryCount: 0,
        maxAttempts: 3,
    };
    result: JsonValue | undefined;
    failure: JobFailure | undefined;

    async get() {
        return { ...this.job };
    }

    async claim() {
        if (this.job.status !== 'queued') return false;
        this.job.status = 'running';
        return true;
    }

    async markRetry(_job: V1JobEnvelope, attempt: number, failure: JobFailure) {
        this.job.status = 'queued';
        this.job.retryCount = attempt;
        this.failure = failure;
    }

    async markCompleted(_job: V1JobEnvelope, result: JsonValue) {
        this.job.status = 'completed';
        this.result = result;
    }

    async markDeadLettered(
        _job: V1JobEnvelope,
        attempt: number,
        failure: JobFailure,
    ) {
        this.job.status = 'dead_lettered';
        this.job.retryCount = attempt;
        this.failure = failure;
    }

    async checkConnection() {
        return true;
    }
}

function delivery(attempt: number) {
    return { attempt, queueJobId: envelope.jobId };
}

describe('canonical V1 job runner', () => {
    let store: MemoryJobStore;

    beforeEach(() => {
        store = new MemoryJobStore();
    });

    it('completes a canonical job and persists its result', async () => {
        const run = createJobRunner({
            store,
            processors: createProcessorRegistry(),
            logger: silentLogger,
            dryRun: true,
            timeoutMs: 1_000,
        });
        const result = await run(envelope, delivery(1));
        assert.equal(result.disposition, 'completed');
        assert.equal(store.job.status, 'completed');
        assert.deepEqual(store.result, result.result);
    });

    it('survives restart and produces one product completion', async () => {
        let executions = 0;
        const registry = createProcessorRegistry({
            'runtime.probe': async () => {
                executions += 1;
                return { executions };
            },
        });
        const firstRuntime = createJobRunner({
            store,
            processors: registry,
            logger: silentLogger,
            dryRun: true,
            timeoutMs: 1_000,
        });
        const secondRuntime = createJobRunner({
            store,
            processors: registry,
            logger: silentLogger,
            dryRun: true,
            timeoutMs: 1_000,
        });
        await firstRuntime(envelope, delivery(1));
        const duplicate = await secondRuntime(envelope, delivery(2));
        assert.equal(duplicate.disposition, 'duplicate');
        assert.equal(executions, 1);
        assert.equal(store.job.status, 'completed');
    });

    it('persists retry state before a later successful attempt', async () => {
        let executions = 0;
        const run = createJobRunner({
            store,
            processors: createProcessorRegistry({
                'runtime.probe': async () => {
                    executions += 1;
                    if (executions === 1) {
                        throw new WorkerTaskError(
                            'transient_test_failure',
                            'Transient test failure.',
                            true,
                        );
                    }
                    return { executions };
                },
            }),
            logger: silentLogger,
            dryRun: true,
            timeoutMs: 1_000,
        });
        await assert.rejects(run(envelope, delivery(1)));
        assert.equal(store.job.status, 'queued');
        assert.equal(store.job.retryCount, 1);
        await run(envelope, delivery(2));
        assert.equal(store.job.status, 'completed');
        assert.equal(executions, 2);
    });

    it('moves a poison job to visible dead-letter state', async () => {
        const run = createJobRunner({
            store,
            processors: createProcessorRegistry({
                'runtime.probe': async () => {
                    throw new WorkerTaskError(
                        'invalid_probe',
                        'Probe payload is invalid.',
                        false,
                    );
                },
            }),
            logger: silentLogger,
            dryRun: true,
            timeoutMs: 1_000,
        });
        await assert.rejects(run(envelope, delivery(1)));
        assert.equal(store.job.status, 'dead_lettered');
        assert.equal(store.failure?.code, 'invalid_probe');
    });

    it('dead-letters a retryable job after max attempts', async () => {
        store.job.maxAttempts = 2;
        const run = createJobRunner({
            store,
            processors: createProcessorRegistry({
                'runtime.probe': async () => {
                    throw new Error('private provider response');
                },
            }),
            logger: silentLogger,
            dryRun: true,
            timeoutMs: 1_000,
        });
        await assert.rejects(run(envelope, delivery(1)));
        await assert.rejects(run(envelope, delivery(2)));
        assert.equal(store.job.status, 'dead_lettered');
        assert.equal(store.failure?.code, 'worker_internal_error');
        assert.doesNotMatch(
            store.failure?.detail ?? '',
            /private provider response/,
        );
    });
});
