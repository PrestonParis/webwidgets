import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import { extractEmailActions } from '@/features/inbox/lib/extractActions';
import type { EmailInput } from '@/features/inbox/lib/extractActions';
import { extractText } from '@/features/inbox/lib/gmailBody';
import type { GmailPart } from '@/features/inbox/lib/gmailBody';
import { z } from 'zod';

const emailInputSchema = z.object({
    id: z.string().min(1),
    subject: z.string(),
    sender: z.string(),
    snippet: z.string(),
    date: z.string().optional(),
});

const requestSchema = z.object({
    emails: z.array(emailInputSchema).max(50),
    force: z.boolean().optional(),
});

export async function POST(req: Request) {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    const body: unknown = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { emails, force } = parsed.data;
    if (emails.length === 0) {
        return NextResponse.json({ actions: [] });
    }

    const emailIds = emails.map((e) => e.id);

    // Which emails have already been processed? (bypassed when force: true)
    let toProcess = emails;
    if (!force) {
        const { data: processedRows } = await supabaseAdmin
            .from('email_processing_log')
            .select('email_id')
            .eq('user_id', user.id)
            .in('email_id', emailIds);

        const processedSet = new Set(
            ((processedRows ?? []) as { email_id: string }[]).map(
                (r) => r.email_id,
            ),
        );
        toProcess = emails.filter((e) => !processedSet.has(e.id));
    }

    if (toProcess.length > 0) {
        const { data: rawProfile } = await supabaseAdmin
            .from('profiles')
            .select('use_ai_email, anthropic_api_key')
            .eq('id', user.id)
            .maybeSingle();

        const profile = rawProfile as {
            use_ai_email: boolean;
            anthropic_api_key: string | null;
        } | null;

        // force=true means the user explicitly clicked "Extract actions" — always run AI
        const useAI = force || (profile?.use_ai_email ?? false);

        // Set up Google clients (shared auth for Gmail + Calendar)
        let gmailFetchBody: ((id: string) => Promise<string>) | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let calendarEvents: any = null;

        try {
            const tokens = await getGoogleTokens(supabaseAdmin, user.id);
            const auth = createGmailClient(tokens);
            const gmail = google.gmail({ version: 'v1', auth });
            const calendar = google.calendar({ version: 'v3', auth });
            calendarEvents = calendar.events;

            gmailFetchBody = async (id: string) => {
                try {
                    const { data: msg } = await gmail.users.messages.get({
                        userId: 'me',
                        id,
                        format: 'full',
                    });
                    return extractText((msg.payload ?? {}) as GmailPart)
                        .trim()
                        .slice(0, 6000);
                } catch {
                    return '';
                }
            };
        } catch {
            /* Gmail/Calendar not connected */
        }

        // Fetch full email bodies in parallel
        const bodiesMap = new Map<string, string>();
        if (gmailFetchBody) {
            await Promise.allSettled(
                toProcess.map(async (e) => {
                    const text = await gmailFetchBody!(e.id);
                    if (text) bodiesMap.set(e.id, text);
                }),
            );
        }

        const emailsWithBody: EmailInput[] = toProcess.map((e) => {
            const emailBody = bodiesMap.get(e.id);
            return {
                id: e.id,
                subject: e.subject,
                sender: e.sender,
                snippet: e.snippet,
                ...(e.date !== undefined ? { date: e.date } : {}),
                ...(emailBody !== undefined ? { body: emailBody } : {}),
            };
        });

        // Step 1: in-house rule-based extraction via ML service
        const extractedMap = new Map<
            string,
            {
                type: string;
                title: string;
                description: string | null;
                due_date: string | null;
                action_url: string | null;
            }[]
        >();
        const mlServiceUrl = process.env.ML_SERVICE_URL;
        if (mlServiceUrl) {
            try {
                const mlRes = await fetch(`${mlServiceUrl}/extract-actions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emails: emailsWithBody }),
                    signal: AbortSignal.timeout(8000),
                });
                if (mlRes.ok) {
                    const mlData = (await mlRes.json()) as {
                        results: {
                            id: string;
                            actions: {
                                type: string;
                                title: string;
                                description: string | null;
                                due_date: string | null;
                                action_url: string | null;
                            }[];
                        }[];
                    };
                    for (const r of mlData.results) {
                        extractedMap.set(r.id, r.actions);
                    }
                    console.log(
                        `[extract-actions] ML extracted ${extractedMap.size} emails with actions`,
                    );
                } else {
                    console.error(
                        `[extract-actions] ML service returned ${mlRes.status}`,
                    );
                }
            } catch (err) {
                console.error('[extract-actions] ML service error:', err);
            }
        } else {
            console.warn('[extract-actions] ML_SERVICE_URL not set');
        }

        // Step 2: Claude fallback for paid tier (only if no key commented out)
        if (useAI) {
            try {
                const claudeMap = await extractEmailActions(emailsWithBody, {
                    ...(profile?.anthropic_api_key
                        ? { apiKey: profile.anthropic_api_key }
                        : {}),
                });
                // Merge: Claude results supplement ML results (ML takes priority for already-found emails)
                for (const [emailId, actions] of claudeMap) {
                    if (!extractedMap.has(emailId)) {
                        extractedMap.set(emailId, actions);
                    }
                }
            } catch {
                /* Claude unavailable */
            }
        }

        await supabaseAdmin.from('email_processing_log').upsert(
            toProcess.map((e) => ({ user_id: user.id, email_id: e.id })),
            { onConflict: 'user_id,email_id' },
        );

        const rows: {
            user_id: string;
            email_id: string;
            type: string;
            title: string;
            description: string | null;
            due_date: string | null;
            action_url: string | null;
            completed: boolean;
        }[] = [];

        for (const [emailId, actions] of extractedMap) {
            for (const action of actions) {
                rows.push({
                    user_id: user.id,
                    email_id: emailId,
                    type: action.type,
                    title: action.title,
                    description: action.description,
                    due_date: action.due_date,
                    action_url: action.action_url,
                    completed: false,
                });
            }
        }

        if (rows.length > 0) {
            const { error: upsertError } = await supabaseAdmin
                .from('email_actions')
                .upsert(rows, { onConflict: 'user_id,email_id,title' });
            if (upsertError) {
                console.error(
                    '[extract-actions] upsert failed:',
                    upsertError.message,
                );
            }
        }
    }

    const { data: allActions, error: selectError } = await supabase
        .from('email_actions')
        .select('*')
        .eq('user_id', user.id)
        .in('email_id', emailIds)
        .eq('completed', false)
        .order('due_date', { ascending: true, nullsFirst: false });

    if (selectError) {
        console.error('[extract-actions] select failed:', selectError.message);
    }
    console.log(
        `[extract-actions] returning ${allActions?.length ?? 0} actions`,
    );

    return NextResponse.json({ actions: allActions ?? [] });
}
