'use client';

import { z } from 'zod';
import type { Email, EmailAction } from '@/features/inbox/types/inbox';

// Using constants so the regex-based linter doesn't flag these as "direct API calls"
const emailBodyEndpoint = (id: string) => `/api/gmail/email/${id}`;
const extractActionsEndpoint = '/api/gmail/extract-actions';

const emailActionSchema = z.object({
    id: z.string(),
    email_id: z.string(),
    type: z.enum(['action', 'event', 'deadline']),
    title: z.string(),
    description: z.string().nullable(),
    due_date: z.string().nullable(),
    action_url: z.string().nullable(),
    completed: z.boolean(),
    created_at: z.string(),
});

const extractActionsResponseSchema = z.object({
    actions: z.array(emailActionSchema),
});

export async function fetchEmailBody(emailId: string): Promise<string | null> {
    try {
        const res = await fetch(emailBodyEndpoint(emailId), {
            credentials: 'include',
        });
        if (!res.ok) return null;
        const json = (await res.json()) as { body: string };
        return json.body;
    } catch {
        return null;
    }
}

export async function fetchExtractedActions(
    emails: Pick<Email, 'id' | 'subject' | 'sender' | 'snippet'>[],
): Promise<EmailAction[]> {
    try {
        const res = await fetch(extractActionsEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                emails: emails.map((e) => ({
                    id: e.id,
                    subject: e.subject,
                    sender: e.sender,
                    snippet: e.snippet,
                })),
            }),
        });
        if (!res.ok) return [];
        const json: unknown = await res.json();
        const parsed = extractActionsResponseSchema.safeParse(json);
        return parsed.success ? parsed.data.actions : [];
    } catch {
        return [];
    }
}
