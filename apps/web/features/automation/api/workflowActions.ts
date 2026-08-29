import { z } from 'zod';
import {
    workflowRequestSchema,
    workflowWorkspaceSchema,
    type WorkflowActionRequest,
} from '@/lib/workflowActions/receipts';
import type { WorkflowActionPayload } from '@/lib/workflowActions/contracts';
async function call(path: string, body?: unknown) {
    const response = await fetch(`/api/workflow-actions${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        cache: 'no-store',
    });
    const data: unknown = await response.json();
    if (!response.ok) {
        const parsed = z.object({ error: z.string() }).safeParse(data);
        throw new Error(
            parsed.success ? parsed.data.error : 'workflow_action_failed',
        );
    }
    return data;
}
export async function loadWorkflowActions() {
    return workflowWorkspaceSchema.parse(await call(''));
}
export async function proposeWorkflow(
    workflow: WorkflowActionPayload,
    key: string,
) {
    return workflowRequestSchema.parse(
        await call('', {
            actionId: 'automation.run',
            idempotencyKey: key,
            workflow,
        }),
    );
}
export async function decideWorkflow(
    action: WorkflowActionRequest,
    decision: 'approved' | 'denied',
) {
    return z
        .object({ request: workflowRequestSchema, queued: z.boolean() })
        .parse(
            await call('/approve', {
                actionRequestId: action.id,
                actionId: action.action_id,
                payloadVersion: action.payload_version,
                payloadHash: action.payload_hash,
                workflow: action.payload,
                decision,
            }),
        );
}
