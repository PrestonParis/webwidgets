import { z } from 'zod';

const header = z
    .string()
    .max(998)
    .refine(
        (value) => !/[\r\n\u0000]/u.test(value),
        'Email headers cannot contain line breaks or null bytes.',
    )
    .trim();
const address = z.email().max(320).pipe(header);
const recipients = z.array(address).max(20);
const messageId = z
    .string()
    .max(500)
    .regex(/^<[^<>\s]+@[^<>\s]+>$/u);

export const emailMessageSchema = z
    .strictObject({
        provider: z.enum(['google', 'microsoft']),
        accountId: z.uuid(),
        from: address,
        to: recipients.min(1),
        cc: recipients,
        bcc: recipients,
        subject: header.min(1),
        body: z
            .string()
            .min(1)
            .max(50_000)
            .refine((value) => !value.includes('\0')),
        reply: z
            .strictObject({
                providerMessageId: z.string().min(1).max(500),
                threadId: z.string().min(1).max(500),
                inReplyTo: messageId,
                references: z.array(messageId).max(50),
            })
            .nullable(),
    })
    .refine(
        (value) => value.to.length + value.cc.length + value.bcc.length <= 20,
        'V1 email actions allow at most 20 recipients.',
    );

export const emailActionProposalSchema = z.strictObject({
    actionId: z.enum(['email.draft', 'email.send']),
    idempotencyKey: z.uuid(),
    message: emailMessageSchema,
});

export const emailApprovalSchema = z.strictObject({
    actionRequestId: z.uuid(),
    actionId: z.enum(['email.draft', 'email.send']),
    payloadVersion: z.number().int().positive(),
    payloadHash: z.string().regex(/^[a-f0-9]{64}$/u),
    message: emailMessageSchema,
    decision: z.enum(['approved', 'denied']),
});

export type EmailMessage = z.infer<typeof emailMessageSchema>;
export type EmailActionId = z.infer<
    typeof emailActionProposalSchema
>['actionId'];

export function hasEmailActionScope(
    provider: EmailMessage['provider'],
    actionId: EmailActionId,
    scopes: readonly string[],
) {
    if (provider === 'microsoft') {
        return (
            scopes.includes('Mail.ReadWrite') &&
            (actionId === 'email.draft' || scopes.includes('Mail.Send'))
        );
    }
    const canRead = scopes.some((scope) =>
        ['gmail.readonly', 'gmail.modify', 'https://mail.google.com/'].includes(
            scope,
        ),
    );
    const canWrite =
        actionId === 'email.draft'
            ? ['gmail.compose', 'gmail.modify', 'https://mail.google.com/']
            : [
                  'gmail.send',
                  'gmail.compose',
                  'gmail.modify',
                  'https://mail.google.com/',
              ];
    return canRead && scopes.some((scope) => canWrite.includes(scope));
}
