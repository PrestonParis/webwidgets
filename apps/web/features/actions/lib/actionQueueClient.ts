import { getLogger } from '@/lib/observability/logger';
import type { ActionRequestEnvelope } from '@/features/actions/lib/schemas/actionPayloadSchemas';

export const actionQueueName = 'v1-action';

interface QueuedActionReceipt {
    id: string;
}

export function enqueueActionJob(
    envelope: ActionRequestEnvelope,
    _userId: string,
): Promise<QueuedActionReceipt | null> {
    getLogger({
        component: 'action-queue',
        actionId: envelope.actionId,
    }).warn(
        'Queued provider actions are unavailable until the canonical Prompt 013 processor is deployed',
    );
    return Promise.resolve<QueuedActionReceipt | null>(null);
}
