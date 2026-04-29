import Anthropic from '@anthropic-ai/sdk';
import { EmailCategory, EMAIL_CATEGORIES } from '@/types/inbox';
import { EmailInput } from '@/types/inbox';

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

    const text =
        msg.content[0].type === 'text' ? msg.content[0].text.trim() : '[]';
    const parsed: { idx: number; category: string }[] = JSON.parse(text);

    const out = new Map<number, EmailCategory>();
    for (const item of parsed) {
        const cat = EMAIL_CATEGORIES.includes(item.category as EmailCategory)
            ? (item.category as EmailCategory)
            : 'other';
        out.set(item.idx, cat);
    }
    return out;
}
