/**
 * Outlook action extraction — mirrors /api/gmail/extract-actions.
 *
 * Accepts a batch of Outlook email snapshots, fetches cached body_text
 * where available, runs Claude extraction, stores results in email_actions,
 * and returns the full action set for the requested email IDs.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { extractEmailActions } from '@/features/inbox/lib/extractActions';
import type { SupabaseClient } from '@supabase/supabase-js';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';

const emailInputSchema = z.object({
    id: z.string().min(1), // snapshot id or raw Outlook message id
    subject: z.string(),
    sender: z.string(),
    snippet: z.string(),
    date: z.string().optional(),
});

const requestSchema = z.object({
    emails: z.array(emailInputSchema).max(50),
    force: z.boolean().optional(),
});

type EmailRequest = z.infer<typeof emailInputSchema>;
type SupabaseAdmin = SupabaseClient;

async function findUnprocessed(
    supabaseAdmin: SupabaseAdmin,
    userId: string,
    emails: EmailRequest[],
    force?: boolean,
): Promise<EmailRequest[]> {
    if (force) return emails;
    const emailIds = emails.map((e) => e.id);
    const { data: logs } = await supabaseAdmin
        .from('email_processing_log')
        .select('email_id')
        .eq('user_id', userId)
        .in('email_id', emailIds);

    const done = new Set(
        ((logs ?? []) as { email_id: string }[]).map((r) => r.email_id),
    );
    return emails.filter((e) => !done.has(e.id));
}

async function enrichWithCachedBodies(
    supabaseAdmin: SupabaseAdmin,
    userId: string,
    emails: EmailRequest[],
) {
    // Outlook snapshots are stored as "outlook:{msgId}" in email_snapshots
    const snapshotIds = emails.map((e) =>
        e.id.startsWith('outlook:') ? e.id : `outlook:${e.id}`,
    );
    const { data: snapshots } = await supabaseAdmin
        .from('email_snapshots')
        .select('id, body_text')
        .eq('user_id', userId)
        .in('id', snapshotIds);

    const cached = new Map<string, string>();
    for (const s of (snapshots ?? []) as {
        id: string;
        body_text: string | null;
    }[]) {
        const rawId = s.id.replace(/^outlook:/, '');
        if (s.body_text) cached.set(rawId, s.body_text);
        if (s.body_text) cached.set(s.id, s.body_text);
    }

    return emails.map((e) => ({
        id: e.id,
        subject: e.subject,
        sender: e.sender,
        snippet: e.snippet,
        ...(e.date !== undefined ? { date: e.date } : {}),
        ...(cached.has(e.id) ? { body: cached.get(e.id)!.slice(0, 6000) } : {}),
    }));
}

export async function POST(req: Request) {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    const body: unknown = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { emails, force } = parsed.data;
    if (emails.length === 0) return NextResponse.json({ actions: [] });

    const emailIds = emails.map((e) => e.id);
    const toProcess = await findUnprocessed(
        supabaseAdmin,
        user.id,
        emails,
        force,
    );

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

        const apiKey =
            profile?.anthropic_api_key ||
            process.env.ANTHROPIC_API_KEY ||
            undefined;

        if (apiKey) {
            const enriched = await enrichWithCachedBodies(
                supabaseAdmin,
                user.id,
                toProcess,
            );

            const actionsMap = await extractEmailActions(enriched, { apiKey });

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

            for (const [emailId, actions] of actionsMap) {
                for (const a of actions) {
                    rows.push({
                        user_id: user.id,
                        email_id: emailId,
                        type: a.type,
                        title: a.title,
                        description: a.description,
                        due_date: a.due_date,
                        action_url: a.action_url,
                        completed: false,
                    });
                }
            }

            if (rows.length > 0) {
                await supabaseAdmin
                    .from('email_actions')
                    .upsert(rows, { onConflict: 'user_id,email_id,title' });
            }
        }

        // Mark as processed regardless of whether actions were found
        await supabaseAdmin.from('email_processing_log').upsert(
            toProcess.map((e) => ({ user_id: user.id, email_id: e.id })),
            { onConflict: 'user_id,email_id' },
        );
    }

    const { data: allActions } = await supabase
        .from('email_actions')
        .select('*')
        .eq('user_id', user.id)
        .in('email_id', emailIds)
        .eq('completed', false)
        .order('due_date', { ascending: true, nullsFirst: false });

    const actionCount = allActions?.length ?? 0;
    if (toProcess.length > 0 && actionCount > 0) {
        await publishActivityEventSafe(supabase, {
            userId: user.id,
            source: 'email',
            eventType: 'email.action_extracted',
            category: 'data',
            severity: 'info',
            priority: 'normal',
            title: `${actionCount} action${actionCount !== 1 ? 's' : ''} extracted from Outlook`,
            body: `${toProcess.length} email${toProcess.length !== 1 ? 's' : ''} analysed`,
            actionUrl: '/inbox',
            metadata: {
                provider: 'outlook',
                emailCount: toProcess.length,
                actionCount,
            },
        });
    }

    return NextResponse.json({ actions: allActions ?? [] });
}
