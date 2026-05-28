import { Worker } from 'bullmq';
import { getLogger } from '@/lib/observability/logger';
import {
    deserializeActionPayload,
    queuedActionJobSchema,
    type ActionRequestEnvelope,
    type QueuedActionJob,
} from '@/features/actions/lib/schemas/actionPayloadSchemas';
import { recordActionQueueLatency } from '@/features/actions/lib/telemetry';
import { actionQueueName, getRedisConnection } from './actionQueueClient';

export function createActionWorker() {
    const redis = getRedisConnection();
    if (!redis) return null;
    const log = getLogger({ component: 'action-worker' });

    const worker = new Worker<QueuedActionJob>(
        actionQueueName,
        async (job) => {
            const data = queuedActionJobSchema.parse(job.data);
            const envelope = deserializeActionPayload(
                data.serializedEnvelope,
            ) as ActionRequestEnvelope;
            const executableEnvelope = {
                ...envelope,
                invocationMode: 'sync' as const,
            };
            const latencyMs = Date.now() - data.queuedAt.getTime();
            recordActionQueueLatency(executableEnvelope.actionId, latencyMs);
            log.info(
                {
                    jobId: job.id,
                    actionId: executableEnvelope.actionId,
                    latencyMs,
                },
                'queued action started',
            );
            const { executeUnifiedAction } =
                await import('@/features/actions/lib/actionEngine');
            return executeUnifiedAction(executableEnvelope, {
                userId: data.userId,
            });
        },
        { connection: redis },
    );

    worker.on('failed', (job, error) => {
        log.error(
            { err: error, jobId: job?.id, actionId: job?.name },
            'queued action failed',
        );
    });

    return worker;
}
