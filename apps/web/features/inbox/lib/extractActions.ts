import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { sharedLlmKey } from '@/lib/llm/sharedKeys';

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

const defaultClient = sharedLlmKey('ANTHROPIC_API_KEY')
    ? new Anthropic()
    : null;

export interface EmailInput {
    id: string;
    subject: string;
    sender: string;
    snippet: string;
    date?: string;
    body?: string;
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
                `${i}. From: ${e.sender}\n   Received: ${e.date ?? today}\n   Subject: ${e.subject}\n   Body: ${e.body ?? e.snippet}`,
        )
        .join('\n\n');

    const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [
            {
                role: 'user',
                content: `Today is ${today}. Extract actionable items from these emails.

Return a JSON object mapping the 0-based email index (as a string key) to an array of items:
{"0": [{"type": "action|event|deadline", "title": "short title", "description": "brief context or null", "due_date": "ISO 8601 UTC datetime or null", "action_url": "URL to complete the action or null"}], "1": []}

Types:
- action: user must do something (reply, sign, submit, schedule, cancel, evaluate, etc.)
- event: a specific meeting, appointment, or scheduled event with a date/time
- deadline: something that expires, renews, or is due by a specific date

For action_url: extract any URL from the body that would directly complete the action. Only include real URLs visible in the text. Do not invent URLs.

Date calculation: when an email mentions a relative time period (e.g. "14-day trial", "expires in 30 days", "renews next month"), calculate the absolute date using the email's "Received" date as the reference, not today's date. Example: "14-day trial" email received 2026-05-01 → deadline 2026-05-15.

Always extract from these patterns even if the email looks automated:
- Free trials / trial periods → deadline item for when trial ends + action item to evaluate or cancel before it does
- Subscription renewals → deadline for renewal date
- Bills / invoices due → deadline item
- Meeting invites / calendar events → event item
- Tasks explicitly assigned to the user → action item
- Documents awaiting signature → action item

Skip: pure marketing promotions with no deadline, social media notifications, shipping confirmations with no action needed, and password-change confirmations.

Return {} only if the email has no genuine deadline, expiry, event, or task for the user.

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
