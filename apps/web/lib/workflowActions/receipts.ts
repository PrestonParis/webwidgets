import { z } from 'zod';
import {
    workflowActionPayloadSchema,
    workflowReceiptSchema,
} from './contracts';
export const workflowRequestSchema = z.object({
    id: z.uuid(),
    action_id: z.literal('automation.run'),
    payload: workflowActionPayloadSchema,
    payload_hash: z.string(),
    payload_version: z.number(),
    approval_state: z.string(),
    status: z.string(),
    requested_at: z.string(),
    expires_at: z.string(),
    failure_code: z.string().nullable(),
    idempotency_key: z.string().min(1),
    automation_run_id: z.uuid(),
});
export const workflowWorkspaceSchema = z.object({
    enabled: z.boolean(),
    configured: z.boolean(),
    configs: z.array(
        z.object({
            id: z.uuid(),
            name: z.string(),
            workflowKey: z.string(),
        }),
    ),
    requests: z.array(workflowRequestSchema),
    outcomes: z.array(
        z.object({
            action_request_id: z.uuid(),
            receipt: workflowReceiptSchema.nullable(),
        }),
    ),
});
export type WorkflowActionRequest = z.infer<typeof workflowRequestSchema>;
export type WorkflowWorkspace = z.infer<typeof workflowWorkspaceSchema>;
