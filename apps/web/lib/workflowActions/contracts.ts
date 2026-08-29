import { z } from 'zod';
import { workflowKeySchema } from '@/lib/n8n/n8nSchemas';
export const workflowActionPayloadSchema = z.strictObject({
    automationConfigId: z.uuid(),
    workflowKey: workflowKeySchema,
    parameters: z
        .record(z.string(), z.json())
        .refine(
            (value) => JSON.stringify(value).length <= 20_000,
            'Parameters are too large.',
        ),
});
export const workflowProposalSchema = z.strictObject({
    actionId: z.literal('automation.run'),
    idempotencyKey: z.uuid(),
    workflow: workflowActionPayloadSchema,
});
export const workflowApprovalSchema = z.strictObject({
    actionRequestId: z.uuid(),
    actionId: z.literal('automation.run'),
    payloadVersion: z.number().int().positive(),
    payloadHash: z.string().regex(/^[a-f0-9]{64}$/u),
    workflow: workflowActionPayloadSchema,
    decision: z.enum(['approved', 'denied']),
});
export const workflowReceiptSchema = z.object({
    state: z.enum(['accepted', 'completed', 'failed', 'unknown']),
    providerObjectId: z.string().nullable(),
    code: z.string(),
});
export const workflowCallbackSchema = z.strictObject({
    callbackId: z.string().min(1).max(200),
    type: z.enum(['workflow.completed', 'workflow.failed']),
    payload: z.strictObject({
        userId: z.uuid(),
        actionRequestId: z.uuid(),
        jobId: z.uuid(),
        idempotencyKey: z.string().min(1).max(300),
        runId: z.string().min(1).max(500),
        result: z.json(),
    }),
});
export type WorkflowActionPayload = z.infer<typeof workflowActionPayloadSchema>;
