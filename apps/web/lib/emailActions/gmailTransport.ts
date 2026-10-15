import { z } from 'zod';
import type { EmailMessage } from './contracts';

export class GmailActionError extends Error {
    constructor(readonly status: number | null) {
        super('gmail_action_request_failed');
    }
}

export function gmailTransport(accessToken: string) {
    return async (path: string, body?: unknown): Promise<unknown> => {
        let response: Response;
        try {
            response = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/${path}`,
                {
                    method: body === undefined ? 'GET' : 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    ...(body === undefined
                        ? {}
                        : { body: JSON.stringify(body) }),
                    signal: AbortSignal.timeout(12_000),
                    redirect: 'error',
                    cache: 'no-store',
                },
            );
        } catch {
            throw new GmailActionError(null);
        }
        if (!response.ok) throw new GmailActionError(response.status);
        return response.json().catch(() => {
            throw new GmailActionError(null);
        });
    };
}

export type GmailTransport = ReturnType<typeof gmailTransport>;

export async function assertGmailSender(
    transport: GmailTransport,
    message: EmailMessage,
) {
    const profile = z
        .object({ emailAddress: z.email() })
        .parse(await transport('profile'));
    if (
        message.provider !== 'google' ||
        profile.emailAddress.toLowerCase() !== message.from.toLowerCase()
    )
        throw new Error('email_account_mismatch');
}
