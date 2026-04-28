import { google } from 'googleapis';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import he from 'he';
import Anthropic from '@anthropic-ai/sdk';
import { cleanDate } from '@/app/lib/utils/time';
import { EMAIL_CATEGORIES, EmailCategory } from '@/types/inbox';

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;

type EmailInput = { idx: number; sender: string; subject: string };

// ── Tier 1: Claude ───────────────────────────────────────────────────────────

async function classifyWithClaude(
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

// ── Tier 2: ML service ───────────────────────────────────────────────────────

async function classifyWithMlService(
    emails: EmailInput[],
): Promise<Map<number, EmailCategory>> {
    const mlUrl = process.env.ML_SERVICE_URL;
    if (!mlUrl) throw new Error('No ML_SERVICE_URL');

    const res = await fetch(`${mlUrl}/predict/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            emails: emails.map(({ idx, sender, subject }) => ({
                id: String(idx),
                sender,
                subject,
            })),
        }),
        signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) throw new Error(`ML service ${res.status}`);

    const predictions: { id: string; category: string }[] = await res.json();
    const out = new Map<number, EmailCategory>();
    for (const p of predictions) {
        const cat = EMAIL_CATEGORIES.includes(p.category as EmailCategory)
            ? (p.category as EmailCategory)
            : 'other';
        out.set(Number(p.id), cat);
    }
    return out;
}

// ── Tier 3: Rule-based ───────────────────────────────────────────────────────

const RULES: { pattern: RegExp; category: EmailCategory }[] = [
    {
        pattern: /github|jira|linear|gitlab|jenkins|vercel|sentry/i,
        category: 'work',
    },
    {
        pattern:
            /invoice|receipt|payment|bank|chase|paypal|stripe|venmo|statement|tax/i,
        category: 'finance',
    },
    {
        pattern: /amazon|ebay|etsy|order|shipped|delivery|tracking|ups|fedex/i,
        category: 'shopping',
    },
    {
        pattern: /unsubscribe|newsletter|digest|weekly|daily|roundup/i,
        category: 'promotions',
    },
    {
        pattern: /linkedin|twitter|facebook|instagram|tiktok|reddit/i,
        category: 'social',
    },
    {
        pattern:
            /alert|notification|noreply|no-reply|donotreply|verify|confirm/i,
        category: 'notifications',
    },
    {
        pattern: /offer|deal|discount|sale|% off|promo|coupon/i,
        category: 'promotions',
    },
];

function classifyWithRules(emails: EmailInput[]): Map<number, EmailCategory> {
    const out = new Map<number, EmailCategory>();
    for (const e of emails) {
        const text = `${e.sender} ${e.subject}`;
        const match = RULES.find((r) => r.pattern.test(text));
        out.set(e.idx, match?.category ?? 'other');
    }
    return out;
}

// ── Classifier with fallback chain ───────────────────────────────────────────

async function classifyEmails(
    emails: EmailInput[],
): Promise<Map<number, EmailCategory>> {
    try {
        return await classifyWithClaude(emails);
    } catch (e) {
        console.warn('Claude classification failed, trying ML service:', e);
    }
    try {
        return await classifyWithMlService(emails);
    } catch (e) {
        console.warn('ML service failed, using rule-based fallback:', e);
    }
    return classifyWithRules(emails);
}

// ── Route ────────────────────────────────────────────────────────────────────

export async function GET(req: Request) {
    const cookieStore = await cookies();

    const makeClient = (key: string) =>
        createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet) => {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        cookieStore.set(name, value, options),
                    );
                },
            },
        });

    const supabase = makeClient(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = makeClient(process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: tokenRow } = await supabaseAdmin
        .from('user_tokens')
        .select('access_token, refresh_token, expires_at')
        .eq('user_id', user.id)
        .maybeSingle();

    if (!tokenRow?.access_token) {
        return NextResponse.json(
            { error: 'No Google token found' },
            { status: 401 },
        );
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI,
    );
    oauth2Client.setCredentials({
        access_token: tokenRow.access_token,
        refresh_token: tokenRow.refresh_token,
        expiry_date: Number(tokenRow.expires_at),
    });

    try {
        await oauth2Client.getAccessToken();
    } catch (e) {
        console.error('OAuth token refresh failed:', e);
        return NextResponse.json(
            { error: 'Gmail auth expired' },
            { status: 401 },
        );
    }

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const { searchParams } = new URL(req.url);
    const pageToken = searchParams.get('pageToken') || undefined;

    try {
        // 1. Fetch message IDs
        const listRes = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 10,
            pageToken,
        });

        const ids = (listRes.data.messages || [])
            .map((m) => m.id!)
            .filter(Boolean);

        if (ids.length === 0) {
            return NextResponse.json({ emails: [], nextPageToken: null });
        }

        // 2. Batch fetch metadata
        const batch = await Promise.all(
            ids.map((id) =>
                gmail.users.messages.get({
                    userId: 'me',
                    id,
                    format: 'metadata',
                    metadataHeaders: ['Subject', 'From', 'Date'],
                }),
            ),
        );

        const parsed = batch.map((email, i) => {
            const headers = email.data.payload?.headers || [];
            return {
                id: ids[i],
                subject:
                    headers.find((h) => h.name === 'Subject')?.value ||
                    'No Subject',
                sender:
                    headers.find((h) => h.name === 'From')?.value ||
                    'Unknown Sender',
                date:
                    cleanDate(
                        headers.find((h) => h.name === 'Date')?.value || '',
                    ) || 'No Date',
                snippet: he.decode(email.data.snippet ?? ''),
            };
        });

        // 3. Load existing classifications (by email_id or sender)
        const emailIds = parsed.map((e) => e.id);
        const senders = [...new Set(parsed.map((e) => e.sender))];

        const { data: existing } = await supabase
            .from('email_classifications')
            .select('email_id, sender, category, is_manual')
            .eq('user_id', user.id)
            .or(
                `email_id.in.(${emailIds.map((id) => `"${id}"`).join(',')}),` +
                    `sender.in.(${senders.map((s) => `"${s}"`).join(',')})`,
            );

        const byId = new Map(existing?.map((c) => [c.email_id, c]) ?? []);
        const bySender = new Map(existing?.map((c) => [c.sender, c]) ?? []);

        const categoryMap = new Map<
            string,
            { category: string; is_manual: boolean }
        >();
        const needsAI: {
            idx: number;
            id: string;
            sender: string;
            subject: string;
        }[] = [];

        for (let i = 0; i < parsed.length; i++) {
            const email = parsed[i];
            const hit = byId.get(email.id) ?? bySender.get(email.sender);
            if (hit) {
                categoryMap.set(email.id, {
                    category: hit.category,
                    is_manual: hit.is_manual,
                });
            } else {
                needsAI.push({ idx: i, ...email });
            }
        }

        // 4. Classify uncategorized emails with Claude
        if (needsAI.length > 0) {
            const predictions = await classifyEmails(
                needsAI.map(({ idx, sender, subject }) => ({
                    idx,
                    sender,
                    subject,
                })),
            );

            const toInsert = needsAI.map(({ idx, id, sender, subject }) => ({
                user_id: user.id,
                email_id: id,
                sender,
                subject,
                category: predictions.get(idx) ?? 'other',
                is_manual: false,
            }));

            // ignoreDuplicates ensures manual classifications are never overwritten
            await supabase.from('email_classifications').upsert(toInsert, {
                onConflict: 'user_id,email_id',
                ignoreDuplicates: true,
            });

            for (const row of toInsert) {
                categoryMap.set(row.email_id, {
                    category: row.category,
                    is_manual: false,
                });
            }
        }

        // 5. Build final response
        const emails = parsed.map((e) => {
            const hit = categoryMap.get(e.id);
            return {
                ...e,
                category: hit?.category ?? 'other',
                is_manual: hit?.is_manual ?? false,
            };
        });

        return NextResponse.json({
            emails,
            nextPageToken: listRes.data.nextPageToken || null,
        });
    } catch (err) {
        console.error('Gmail Fetch Error', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
