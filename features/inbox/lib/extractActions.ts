import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

export type ActionType = 'action' | 'event' | 'deadline';

export interface ExtractedAction {
    type: ActionType;
    title: string;
    description: string | null;
    due_date: string | null;
    action_url: string | null;
}

const actionSchema = z.object({
    type: z.enum(['action', 'event', 'deadline']),
    title: z.string().min(1),
    description: z.string().nullable().optional(),
    due_date: z.string().nullable().optional(),
    action_url: z.string().nullable().optional(),
});

const responseSchema = z.record(z.string(), z.array(actionSchema));

const defaultClient = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export interface EmailInput {
    id: string;
    subject: string;
    sender: string;
    snippet: string;
}

export interface ExtractOptions {
    apiKey?: string;
}

export async function extractEmailActions(
    emails: EmailInput[],
    { apiKey }: ExtractOptions = {},
): Promise<Map<string, ExtractedAction[]>> {
    const anthropic = apiKey ? new Anthropic({ apiKey }) : defaultClient;
    const result = new Map<string, ExtractedAction[]>();
    if (!anthropic || emails.length === 0) return result;

    const today = new Date().toISOString().split('T')[0]!;

    const emailList = emails
        .map(
            (e, i) =>
                `${i}. From: ${e.sender}\n   Subject: ${e.subject}\n   Preview: ${e.snippet}`,
        )
        .join('\n\n');

    const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: `Today is ${today}. Extract actionable items from these emails. Ignore newsletters, marketing, and automated notifications with no user action needed.

Return a JSON object mapping the 0-based email index (as a string key) to an array of items:
{"0": [{"type": "action|event|deadline", "title": "short title", "description": "brief context or null", "due_date": "ISO 8601 UTC datetime or null", "action_url": "URL to complete the action or null"}], "1": []}

Types:
- action: user must do something (reply, sign, submit, schedule, etc.)
- event: a specific meeting, appointment, or event with a date/time
- deadline: something that expires or is due by a specific date

For action_url: extract any URL from the snippet that would directly complete the action (e.g. a link to sign a document, join a meeting, view an invoice, track a package). Only include real URLs visible in the snippet — never invent URLs.

Return {} if no emails have actionable content. Be selective — only include genuine user actions.

Emails:
${emailList}`,
            },
        ],
    });

    const first = msg.content[0];
    const raw = first?.type === 'text' ? first.text.trim() : '{}';
    const text = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    let parsed: Record<string, unknown>;
    try {
        const json: unknown = JSON.parse(text);
        if (typeof json !== 'object' || json === null || Array.isArray(json)) {
            return result;
        }
        parsed = json as Record<string, unknown>;
    } catch {
        return result;
    }

    const validated = responseSchema.safeParse(parsed);
    if (!validated.success) return result;

    for (const [idxStr, actions] of Object.entries(validated.data)) {
        const idx = parseInt(idxStr, 10);
        const email = emails[idx];
        if (!email || isNaN(idx)) continue;

        result.set(
            email.id,
            actions.map((a) => ({
                type: a.type,
                title: a.title,
                description: a.description ?? null,
                due_date: a.due_date ?? null,
                action_url: a.action_url ?? null,
            })),
        );
    }

    return result;
}
