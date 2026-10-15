import { z } from 'zod';
import type { EmailActionId, EmailMessage } from './contracts';
import { approvedGmailRaw, emailCorrelationId } from './gmailMime';
import {
    assertGmailSender,
    GmailActionError,
    type GmailTransport,
} from './gmailTransport';

const providerMessage = z.object({
    id: z.string().min(1),
    threadId: z.string().min(1),
    labelIds: z.array(z.string()).default([]),
    payload: z.object({
        headers: z.array(z.object({ name: z.string(), value: z.string() })),
    }),
});
const reference = z.object({ id: z.string().min(1) });

interface GmailActionInput {
    requestId: string;
    actionId: EmailActionId;
    message: EmailMessage;
    dispatchAllowed: boolean;
    providerObjectId?: string | null;
}

export type EmailDispatchCheckpoint = (
    state: 'prepared' | 'dispatching',
    providerObjectId: string,
) => Promise<void>;

export interface EmailProviderOutcome {
    state: 'verified' | 'failed' | 'unknown';
    providerObjectId: string | null;
    providerMessageId: string | null;
    threadId: string | null;
    code: string;
}

const header = (data: z.infer<typeof providerMessage>, name: string) =>
    data.payload.headers.find((item) => item.name.toLowerCase() === name)
        ?.value;

async function verifyReply(transport: GmailTransport, message: EmailMessage) {
    if (!message.reply) return;
    const original = providerMessage.parse(
        await transport(
            `messages/${encodeURIComponent(message.reply.providerMessageId)}?format=metadata`,
        ),
    );
    const references = (header(original, 'references') ?? '')
        .trim()
        .split(/\s+/u)
        .filter(Boolean);
    if (
        original.threadId !== message.reply.threadId ||
        header(original, 'message-id') !== message.reply.inReplyTo ||
        header(original, 'subject') !== message.subject ||
        JSON.stringify(references) !== JSON.stringify(message.reply.references)
    )
        throw new Error('email_reply_mismatch');
}

async function reconcileId(transport: GmailTransport, input: GmailActionInput) {
    if (input.providerObjectId) return input.providerObjectId;
    const kind = input.actionId === 'email.draft' ? 'drafts' : 'messages';
    const query = new URLSearchParams({
        q: `rfc822msgid:${emailCorrelationId(input.requestId)}`,
        maxResults: '2',
    });
    if (kind === 'messages') query.set('labelIds', 'SENT');
    const result = z
        .object({
            drafts: z.array(reference).optional(),
            messages: z.array(reference).optional(),
        })
        .parse(await transport(`${kind}?${query}`));
    const matches = result[kind] ?? [];
    return matches.length === 1 ? matches[0]!.id : null;
}

async function verifyObject(
    transport: GmailTransport,
    input: GmailActionInput,
    objectId: string,
) {
    const isDraft = input.actionId === 'email.draft';
    const query = isDraft
        ? 'format=full&fields=id,message(id,threadId,labelIds,payload/headers)'
        : 'format=metadata';
    const result = await transport(
        `${isDraft ? 'drafts' : 'messages'}/${encodeURIComponent(objectId)}?${query}`,
    );
    const data = isDraft
        ? z.object({ message: providerMessage }).parse(result).message
        : providerMessage.parse(result);
    if (
        header(data, 'message-id') !== emailCorrelationId(input.requestId) ||
        !data.labelIds.includes(isDraft ? 'DRAFT' : 'SENT') ||
        (input.message.reply && data.threadId !== input.message.reply.threadId)
    )
        throw new Error('email_receipt_mismatch');
    return data;
}

export async function executeGmailAction(
    transport: GmailTransport,
    input: GmailActionInput,
    _checkpoint?: EmailDispatchCheckpoint,
): Promise<EmailProviderOutcome> {
    let objectId = input.providerObjectId ?? null;
    let writing = false;
    try {
        z.enum(['email.draft', 'email.send']).parse(input.actionId);
        await assertGmailSender(transport, input.message);
        if (input.dispatchAllowed) {
            await verifyReply(transport, input.message);
            const message = {
                raw: approvedGmailRaw(input.requestId, input.message),
                ...(input.message.reply
                    ? { threadId: input.message.reply.threadId }
                    : {}),
            };
            writing = true;
            const result = await transport(
                input.actionId === 'email.draft' ? 'drafts' : 'messages/send',
                input.actionId === 'email.draft' ? { message } : message,
            );
            objectId = reference.parse(result).id;
        } else {
            objectId = await reconcileId(transport, input);
        }
        if (!objectId) throw new Error('email_reconciliation_pending');
        const data = await verifyObject(transport, input, objectId);
        return {
            state: 'verified',
            providerObjectId: objectId,
            providerMessageId: data.id,
            threadId: data.threadId,
            code:
                input.actionId === 'email.draft'
                    ? 'draft_verified'
                    : 'sent_verified_not_delivery',
        };
    } catch (error) {
        // A completed HTTP write followed by a failed read is still uncertain.
        const rejected =
            writing &&
            !objectId &&
            error instanceof GmailActionError &&
            error.status !== null &&
            [400, 401, 403, 404, 429].includes(error.status);
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
