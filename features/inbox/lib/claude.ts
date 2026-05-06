import Anthropic from '@anthropic-ai/sdk';
import { EmailCategory, EMAIL_CATEGORIES } from '@/features/inbox/types/inbox';
import { EmailInput } from '@/features/inbox/types/inbox';
import { z } from 'zod';

const claudePredictionSchema = z.object({
    idx: z.number(),
    category: z.string(),
});

const claudePredictionsSchema = z.array(claudePredictionSchema);

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

export async function classifyWithClaude(
    emails: EmailInput[],
): Promise<Map<number, EmailCategory>> {
    if (!anthropic) throw new Error('No ANTHROPIC_API_KEY');

    const list = emails
        .map((e) => `${e.idx}. From: ${e.sender}\n   Subject: ${e.subject}`)
        .join('\n');

    const msg = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 256,
        messages: [
            {
                role: 'user',
                content: `Classify each email into exactly one of: ${EMAIL_CATEGORIES.join(', ')}.

Reply with ONLY a JSON array of objects like: [{"idx":0,"category":"work"},...]

Emails:
${list}`,
            },
        ],
    });

    const first = msg.content[0];
    const raw = first?.type === 'text' ? first.text.trim() : '[]';
    const text = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    const parsedJson: unknown = JSON.parse(text);
    const parsed = claudePredictionsSchema.safeParse(parsedJson);
    if (!parsed.success) return new Map<number, EmailCategory>();

    const out = new Map<number, EmailCategory>();
    for (const item of parsed.data) {
        const cat = EMAIL_CATEGORIES.includes(item.category as EmailCategory)
            ? (item.category as EmailCategory)
            : 'other';
        out.set(item.idx, cat);
    }
    return out;
}
