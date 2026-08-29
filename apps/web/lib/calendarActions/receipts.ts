import { z } from 'zod';
import {
    calendarActionPayloadSchema,
    calendarReceiptSchema,
} from './contracts';
export const calendarRequestSchema = z.object({
    id: z.uuid(),
    action_id: z.literal('calendar.create_event'),
    payload: calendarActionPayloadSchema,
    payload_hash: z.string(),
    payload_version: z.number(),
    approval_state: z.string(),
    status: z.string(),
    requested_at: z.string(),
    expires_at: z.string(),
    failure_code: z.string().nullable(),
});
export const calendarWorkspaceSchema = z.object({
    enabled: z.boolean(),
    accounts: z.array(
        z.object({
            id: z.uuid(),
            email: z.email(),
            granted_scopes: z.array(z.string()),
        }),
    ),
    requests: z.array(calendarRequestSchema),
    outcomes: z.array(
        z.object({
            action_request_id: z.uuid(),
            receipt: calendarReceiptSchema.nullable(),
            undo_state: z.string(),
        }),
    ),
});
export type CalendarActionRequest = z.infer<typeof calendarRequestSchema>;
export type CalendarWorkspace = z.infer<typeof calendarWorkspaceSchema>;
