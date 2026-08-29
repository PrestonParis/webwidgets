import { z } from 'zod';
import type { EmailActionId, EmailMessage } from './contracts';
import { approvedGmailRaw, emailCorrelationId } from './gmailMime';
import type {
    EmailDispatchCheckpoint,
    EmailProviderOutcome,
} from './gmailAdapter';
import {
    assertOutlookSender,
    OutlookActionError,
    type OutlookTransport,
} from './outlookTransport';

const messageSchema = z.object({
    id: z.string().min(1),
    internetMessageId: z.string().min(1),
    conversationId: z.string().min(1),
    isDraft: z.boolean(),
});
interface OutlookInput {
    requestId: string;
    actionId: EmailActionId;
    message: EmailMessage;
    dispatchAllowed: boolean;
    providerObjectId?: string | null;
}

async function verify(
    transport: OutlookTransport,
    input: OutlookInput,
    id: string,
) {
    const data = messageSchema.parse(
        await transport(
            `me/messages/${encodeURIComponent(id)}?$select=id,internetMessageId,conversationId,isDraft`,
        ),
    );
    if (
        data.internetMessageId !== emailCorrelationId(input.requestId) ||
        data.isDraft !== (input.actionId === 'email.draft') ||
        (input.message.reply &&
            data.conversationId !== input.message.reply.threadId)
    )
        throw new Error('email_receipt_mismatch');
    return data;
}

export async function executeOutlookAction(
    transport: OutlookTransport,
    input: OutlookInput,
    checkpoint: EmailDispatchCheckpoint,
): Promise<EmailProviderOutcome> {
    let objectId = input.providerObjectId ?? null;
    let writing = false;
    let submitting = false;
    try {
        z.enum(['email.draft', 'email.send']).parse(input.actionId);
        await assertOutlookSender(transport, input.message);
        if (input.message.reply) throw new Error('outlook_reply_not_enabled');
        if (input.dispatchAllowed) {
            const raw = Buffer.from(
                approvedGmailRaw(input.requestId, input.message),
                'base64url',
            ).toString('base64');
            writing = true;
            const created = messageSchema.parse(
                await transport('me/messages', { method: 'POST', mime: raw }),
            );
            objectId = created.id;
            await checkpoint('prepared', objectId);
            if (input.actionId === 'email.send') {
                await checkpoint('dispatching', objectId);
                submitting = true;
                await transport(
                    `me/messages/${encodeURIComponent(objectId)}/send`,
                    { method: 'POST' },
                );
                submitting = false;
            }
        }
        if (!objectId) throw new Error('email_reconciliation_pending');
        const data = await verify(transport, input, objectId);
        return {
            state: 'verified',
            providerObjectId: objectId,
            providerMessageId: data.internetMessageId,
            threadId: data.conversationId,
            code:
                input.actionId === 'email.draft'
                    ? 'draft_verified'
                    : 'sent_verified_not_delivery',
        };
    } catch (error) {
        const rejected =
            writing &&
            (!objectId || submitting) &&
            error instanceof OutlookActionError &&
            error.status !== null &&
            [400, 401, 403, 404, 409, 429].includes(error.status);
        const beforeWrite = input.dispatchAllowed && !writing;
        return {
            state: rejected || beforeWrite ? 'failed' : 'unknown',
            providerObjectId: objectId,
            providerMessageId: null,
            threadId: null,
            code:
                rejected || beforeWrite
                    ? 'email_execution_blocked'
                    : 'email_outcome_unknown',
        };
    }
}
