import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { sharedLlmKey } from '@/lib/llm/sharedKeys';

const requestSchema = z.object({
    emailId: z.string(),
    subject: z.string(),
    body: z.string(),
    sender: z.string(),
});

const summarySchema = z.object({
    tldr: z.string(),
    emailType: z.enum([
        'meeting',
        'task',
        'deadline',
        'document',
        'reminder',
        'followup',
        'finance',
        'alert',
        'verification',
        'update',
        'newsletter',
        'other',
    ]),
    keyDates: z.array(z.string()),
    requiredActions: z.array(z.string()),
    peopleMentioned: z.array(z.string()),
});

export type EmailSummary = z.infer<typeof summarySchema>;

const client = sharedLlmKey('ANTHROPIC_API_KEY') ? new Anthropic() : null;

const SYSTEM_PROMPT = `You are an email intelligence assistant. Analyze emails and extract structured information concisely.
Always respond with valid JSON only. No markdown fences, no explanation text.`;

export async function POST(req: Request) {
    const { supabase } = await createClients();
    try {
        await getUserOrThrow(supabase);
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw: unknown = await req.json();
    const parsed = requestSchema.safeParse(raw);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    if (!client) {
        return NextResponse.json(
            { error: 'AI not configured' },
            { status: 503 },
        );
    }

    const { subject, body, sender } = parsed.data;
    // Cap body to avoid large tokens — first 3 000 chars is enough for summary
    const bodyExcerpt = body.slice(0, 3_000);

    let responseText = '';
    try {
        const msg = await client.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 512,
            system: [
                {
                    type: 'text',
                    text: SYSTEM_PROMPT,
                    cache_control: { type: 'ephemeral' },
                },
            ],
            messages: [
                {
                    role: 'user',
                    content: `Analyze this email and return exactly this JSON structure:
{
  "tldr": "One sentence: what does this email need from the recipient, or what is it about?",
  "emailType": "meeting|task|deadline|document|reminder|followup|finance|alert|verification|update|newsletter|other",
  "keyDates": ["array of specific dates or deadlines mentioned, e.g. 'June 4: I-9 due'"],
  "requiredActions": ["array of things the recipient must do, short phrases"],
  "peopleMentioned": ["array of people or companies mentioned by name"]
}

Rules:
- tldr must be one sentence, action-oriented
- emailType: meeting if it's a calendar invite or meeting request; task if explicit TODO assigned; deadline if due date; finance if billing/payment/invoice; alert if security/warning; verification if confirming identity; newsletter/promotion → newsletter; other → other
- Return empty arrays [] if nothing to list
- peopleMentioned should include company names too

From: ${sender}
Subject: ${subject}
Body:
${bodyExcerpt}`,
                },
            ],
        });

        const first = msg.content[0];
        responseText = first?.type === 'text' ? first.text.trim() : '{}';
    } catch (err) {
        console.error('[summarize] Claude error:', err);
        return NextResponse.json(
            { error: 'AI request failed' },
            { status: 500 },
        );
    }

    const cleaned = responseText
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

    let parsed2: z.infer<typeof summarySchema>;
    try {
        const json: unknown = JSON.parse(cleaned);
        const result = summarySchema.safeParse(json);
        if (!result.success) {
            return NextResponse.json(
                { error: 'Malformed AI response' },
                { status: 500 },
            );
        }
        parsed2 = result.data;
    } catch {
        return NextResponse.json({ error: 'Parse failed' }, { status: 500 });
    }

    return NextResponse.json(parsed2);
}
