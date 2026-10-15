import { z } from 'zod';
import type { EmailMessage } from './contracts';

export class OutlookActionError extends Error {
    constructor(readonly status: number | null) {
        super('outlook_action_request_failed');
    }
}

export function outlookTransport(accessToken: string) {
    return async (
        path: string,
        options: {
            method?: 'GET' | 'POST';
            body?: unknown;
            mime?: string;
        } = {},
    ): Promise<unknown> => {
        let response: Response;
        try {
            response = await fetch(`https://graph.microsoft.com/v1.0/${path}`, {
                method: options.method ?? 'GET',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    Prefer: 'IdType="ImmutableId"',
                    ...(options.mime
                        ? { 'Content-Type': 'text/plain' }
                        : { 'Content-Type': 'application/json' }),
                },
                ...(options.mime
                    ? { body: options.mime }
                    : options.body === undefined
                      ? {}
                      : { body: JSON.stringify(options.body) }),
                signal: AbortSignal.timeout(12_000),
                redirect: 'error',
                cache: 'no-store',
            });
        } catch {
            throw new OutlookActionError(null);
        }
        if (!response.ok) throw new OutlookActionError(response.status);
        if (response.status === 202 || response.status === 204) return null;
        try {
            return (await response.json()) as unknown;
        } catch {
            throw new OutlookActionError(null);
        }
    };
}

export type OutlookTransport = ReturnType<typeof outlookTransport>;

export async function assertOutlookSender(
    transport: OutlookTransport,
    message: EmailMessage,
) {
    const profile = z
        .object({
            mail: z.email().nullable().optional(),
            userPrincipalName: z.email().optional(),
        })
        .parse(await transport('me?$select=mail,userPrincipalName'));
    if (
        message.provider !== 'microsoft' ||
        (profile.mail ?? profile.userPrincipalName)?.toLowerCase() !==
            message.from.toLowerCase()
    )
        throw new Error('email_account_mismatch');
}
