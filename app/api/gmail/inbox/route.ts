import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { EmailInput, EmailCategory } from '@/types/inbox';
import { classifyWithClaude } from '@/features/inbox/lib/claude';
import { classifyWithMlService } from '@/features/inbox/lib/mlService';
import { classifyWithRules } from '@/features/inbox/lib/rules';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import { fetchEmailBatch } from '@/features/inbox/hooks/useFetchEmails';
import { parseEmails } from '@/features/inbox/lib/parseEmails';

// Classification Logic with Fallbacks
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

// Fetch a batch of email IDs from Gmail
export async function GET(req: Request) {
    try {
        const { supabase, supabaseAdmin } = await createClients();
        const user = await getUserOrThrow(supabase);
        const tokens = await getGoogleTokens(supabaseAdmin, user.id);

        const auth = createGmailClient(tokens);
        await auth.getAccessToken();

        const gmail = google.gmail({ version: 'v1', auth });

        const { searchParams } = new URL(req.url);
        const pageToken = searchParams.get('pageToken') || undefined;

        const { ids, nextPageToken } = await fetchEmailBatch(gmail, pageToken);

        if (ids.length === 0) {
            return NextResponse.json({ emails: [], nextPageToken: null });
        }

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

        const parsed = parseEmails(batch, ids);

        // ── Existing classifications ─────────────────────────────
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

        // ── AI classification ────────────────────────────────────

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

        // ── Final response ───────────────────────────────────────

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
            nextPageToken: nextPageToken || null,
        });
    } catch (err) {
        console.error('Gmail Fetch Error', err);
        return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }
}
