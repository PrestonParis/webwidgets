import { z } from 'zod';
import type { EmailActionId, EmailMessage } from '@/lib/emailActions/contracts';
import {
    emailRequestSchema,
    emailWorkspaceSchema,
    type EmailActionRequest,
} from '@/lib/emailActions/receipts';

async function request(path: string, body?: unknown): Promise<unknown> {
    const response = await fetch(`/api/email-actions${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        cache: 'no-store',
    });
    const data: unknown = await response.json();
    if (!response.ok) {
        const error = z.object({ error: z.string() }).safeParse(data);
        throw new Error(
            error.success ? error.data.error : 'email_request_failed',
        );
    }
    return data;
}

export async function loadEmailWorkspace() {
    return emailWorkspaceSchema.parse(await request(''));
}

export async function proposeEmail(
    actionId: EmailActionId,
    message: EmailMessage,
    idempotencyKey: string,
) {
    return emailRequestSchema.parse(
        await request('', { actionId, message, idempotencyKey }),
    );
}

export async function decideEmail(
    action: EmailActionRequest,
    decision: 'approved' | 'denied',
) {
    return z.object({ request: emailRequestSchema, queued: z.boolean() }).parse(
        await request('/approve', {
            actionRequestId: action.id,
            actionId: action.action_id,
            payloadVersion: action.payload_version,
            payloadHash: action.payload_hash,
            message: action.payload,
            decision,
        }),
    );
}

export async function reconcileEmail(actionRequestId: string) {
    await request('/reconcile', { actionRequestId });
}
