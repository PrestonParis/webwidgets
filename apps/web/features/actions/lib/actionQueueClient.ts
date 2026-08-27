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
        'Browser action envelopes cannot enqueue without a canonical approved action request',
    );
    return Promise.resolve<QueuedActionReceipt | null>(null);
}
