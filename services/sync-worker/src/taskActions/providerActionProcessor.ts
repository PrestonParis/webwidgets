import { z } from 'zod';
import type { WorkerEnv } from '../env.js';
import type { V1JobEnvelope } from '../v1/contracts.js';
import { WorkerTaskError } from '../v1/processors.js';

const emailReceipt = z.object({
    state: z.enum(['verified', 'failed', 'unknown']),
    providerObjectId: z.string().nullable(),
    providerMessageId: z.string().nullable(),
    threadId: z.string().nullable(),
    code: z.string(),
});
const calendarReceipt = z.object({
    state: z.enum(['verified', 'failed', 'unknown', 'cancelled']),
    providerObjectId: z.string().nullable(),
    htmlLink: z.string().nullable(),
    start: z.string().nullable(),
    end: z.string().nullable(),
    code: z.string(),
});
const workflowReceipt = z.object({
    state: z.enum(['accepted', 'completed', 'failed', 'unknown']),
    providerObjectId: z.string().nullable(),
    code: z.string(),
});
type ProviderKind = 'email' | 'calendar' | 'workflow';
const schemas = {
    email: emailReceipt,
    calendar: calendarReceipt,
    workflow: workflowReceipt,
};

export async function executeProviderAction(
    env: WorkerEnv,
    envelope: V1JobEnvelope,
    kind: ProviderKind,
) {
    if (envelope.task.kind !== 'action.execute')
        throw new WorkerTaskError(
            'action_invalid',
            'Invalid action task.',
            false,
        );
    const response = await fetch(
        new URL(`/api/internal/${kind}-actions/execute`, env.WEB_APP_URL),
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${env.WORKER_API_TOKEN}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: envelope.userId,
                jobId: envelope.jobId,
                actionRequestId: envelope.task.actionRequestId,
            }),
            signal: AbortSignal.timeout(
                Math.min(55_000, env.JOB_TIMEOUT_MS - 5_000),
            ),
        },
    ).catch(() => null);
    if (!response?.ok)
        throw new WorkerTaskError(
            `${kind}_execution_unconfirmed`,
            'Provider execution is unconfirmed. A reserved dispatch may only be reconciled.',
            response?.status !== 401,
        );
    const parsed = schemas[kind].safeParse(
        await response.json().catch(() => null),
    );
    if (!parsed.success)
        throw new WorkerTaskError(
            `${kind}_receipt_invalid`,
            'Provider receipt is unconfirmed.',
            true,
        );
    return parsed.data;
}
