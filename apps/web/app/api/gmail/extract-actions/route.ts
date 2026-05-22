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

const actionSchema = z.object({
    type: z.string(),
    title: z.string(),
    description: z.string().nullable(),
    due_date: z.string().nullable(),
    action_url: z.string().nullable(),
});

const mlExtractionSchema = z.object({
    results: z.array(
        z.object({ id: z.string(), actions: z.array(actionSchema) }),
    ),
});

type ExtractedAction = z.infer<typeof actionSchema>;
type EmailRequest = z.infer<typeof emailInputSchema>;
type SupabaseAdmin = Awaited<ReturnType<typeof createClients>>['supabaseAdmin'];
type Profile = {
    use_ai_email: boolean;
    anthropic_api_key: string | null;
} | null;
type ActionRow = {
    user_id: string;
    email_id: string;
    type: string;
    title: string;
    description: string | null;
    due_date: string | null;
    action_url: string | null;
    completed: boolean;
};

async function addMlExtractions(
    extractedMap: Map<string, ExtractedAction[]>,
    emailsWithBody: EmailInput[],
) {
    const mlServiceUrl = process.env.ML_SERVICE_URL;
    if (!mlServiceUrl) {
        console.warn('[extract-actions] ML_SERVICE_URL not set');
        return;
    }

    try {
        const mlRes = await fetch(`${mlServiceUrl}/extract-actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emails: emailsWithBody }),
            signal: AbortSignal.timeout(8000),
        });

        if (!mlRes.ok) {
            console.error(
                `[extract-actions] ML service returned ${mlRes.status}`,
            );
            return;
        }

        const mlData = mlExtractionSchema.parse(await mlRes.json());
        for (const r of mlData.results) {
            extractedMap.set(r.id, r.actions);
        }
        console.log(
            `[extract-actions] ML extracted ${extractedMap.size} emails with actions`,
        );
    } catch (err) {
        console.error('[extract-actions] ML service error:', err);
    }
}

async function addClaudeExtractions(
    extractedMap: Map<string, ExtractedAction[]>,
    emailsWithBody: EmailInput[],
    apiKey?: string | null,
) {
    try {
        const claudeMap = await extractEmailActions(emailsWithBody, {
            ...(apiKey ? { apiKey } : {}),
        });
        for (const [emailId, actions] of claudeMap) {
            if (!extractedMap.has(emailId)) {
                extractedMap.set(emailId, actions);
            }
        }
    } catch {
        /* Claude unavailable */
    }
}

async function parseRequest(req: Request) {
    const body: unknown = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
        return {
            ok: false as const,
            response: NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 },
            ),
        };
    }
    return { ok: true as const, data: parsed.data };
}

async function findEmailsToProcess(
    supabaseAdmin: SupabaseAdmin,
    userId: string,
    emails: EmailRequest[],
    force?: boolean,
) {
    if (force) return emails;
    const emailIds = emails.map((e) => e.id);
    const { data: processedRows } = await supabaseAdmin
        .from('email_processing_log')
        .select('email_id')
        .eq('user_id', userId)
        .in('email_id', emailIds);

    const processedSet = new Set(
        ((processedRows ?? []) as { email_id: string }[]).map(
            (r) => r.email_id,
        ),
    );
    return emails.filter((e) => !processedSet.has(e.id));
}

async function getProfile(
    supabaseAdmin: SupabaseAdmin,
    userId: string,
): Promise<Profile> {
    const { data: rawProfile } = await supabaseAdmin
        .from('profiles')
        .select('use_ai_email, anthropic_api_key')
        .eq('id', userId)
        .maybeSingle();
    return rawProfile as Profile;
}

async function createBodyFetcher(supabaseAdmin: SupabaseAdmin, userId: string) {
    try {
        const tokens = await getGoogleTokens(supabaseAdmin, userId);
        const auth = createGmailClient(tokens);
        const gmail = google.gmail({ version: 'v1', auth });
        return async (id: string) => {
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
        return null;
    }
}

async function buildEmailsWithBody(
    supabaseAdmin: SupabaseAdmin,
    userId: string,
    emails: EmailRequest[],
): Promise<EmailInput[]> {
    const fetchBody = await createBodyFetcher(supabaseAdmin, userId);
    const bodiesMap = new Map<string, string>();
    if (fetchBody) {
        await Promise.allSettled(
            emails.map(async (e) => {
                const text = await fetchBody(e.id);
                if (text) bodiesMap.set(e.id, text);
            }),
        );
    }
    return emails.map((e) => {
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
}

function buildActionRows(
    extractedMap: Map<string, ExtractedAction[]>,
    userId: string,
): ActionRow[] {
    const rows: ActionRow[] = [];
    for (const [emailId, actions] of extractedMap) {
        for (const action of actions) {
            rows.push({
                user_id: userId,
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
    return rows;
}

async function processEmails(
    supabaseAdmin: SupabaseAdmin,
    userId: string,
    emails: EmailRequest[],
    profile: Profile,
    force?: boolean,
) {
    const emailsWithBody = await buildEmailsWithBody(
        supabaseAdmin,
        userId,
        emails,
    );
    const extractedMap = new Map<string, ExtractedAction[]>();
    await addMlExtractions(extractedMap, emailsWithBody);
    if (force || (profile?.use_ai_email ?? false)) {
        await addClaudeExtractions(
            extractedMap,
            emailsWithBody,
            profile?.anthropic_api_key,
        );
    }

    await supabaseAdmin.from('email_processing_log').upsert(
        emails.map((e) => ({ user_id: userId, email_id: e.id })),
        { onConflict: 'user_id,email_id' },
    );

    const rows = buildActionRows(extractedMap, userId);
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

export async function POST(req: Request) {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);
    const parsed = await parseRequest(req);
    if (!parsed.ok) return parsed.response;

    const { emails, force } = parsed.data;
    if (emails.length === 0) return NextResponse.json({ actions: [] });

    const emailIds = emails.map((e) => e.id);
    const toProcess = await findEmailsToProcess(
        supabaseAdmin,
        user.id,
        emails,
        force,
    );
    if (toProcess.length > 0) {
        const profile = await getProfile(supabaseAdmin, user.id);
        await processEmails(supabaseAdmin, user.id, toProcess, profile, force);
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
