import { z } from 'zod';
import { emailMessageSchema } from './contracts';

export const emailReceiptSchema = z.object({
    state: z.enum(['verified', 'failed', 'unknown']),
    providerObjectId: z.string().nullable(),
    providerMessageId: z.string().nullable(),
    threadId: z.string().nullable(),
    code: z.string(),
});

export const emailRequestSchema = z.object({
    id: z.uuid(),
    action_id: z.enum(['email.draft', 'email.send']),
    payload: emailMessageSchema,
    payload_hash: z.string(),
    payload_version: z.number(),
    approval_state: z.string(),
    status: z.string(),
    requested_at: z.string(),
    expires_at: z.string(),
    failure_code: z.string().nullable(),
});

export const emailAccountSchema = z.object({
    id: z.uuid(),
    provider: z.enum(['google', 'microsoft']),
    email: z.email(),
    granted_scopes: z.array(z.string()),
});

export const emailWorkspaceSchema = z.object({
    enabled: z.boolean(),
    accounts: z.array(emailAccountSchema),
    requests: z.array(emailRequestSchema),
    outcomes: z.array(
        z.object({
            action_request_id: z.uuid(),
            receipt: emailReceiptSchema.nullable(),
        }),
    ),
});

export type EmailActionRequest = z.infer<typeof emailRequestSchema>;
export type EmailWorkspace = z.infer<typeof emailWorkspaceSchema>;
