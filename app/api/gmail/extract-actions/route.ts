import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { extractEmailActions } from '@/features/inbox/lib/extractActions';
import type { EmailInput } from '@/features/inbox/lib/extractActions';
import { z } from 'zod';

const emailInputSchema = z.object({
    id: z.string().min(1),
    subject: z.string(),
    sender: z.string(),
    snippet: z.string(),
});

const requestSchema = z.object({
    emails: z.array(emailInputSchema).max(50),
});

export async function POST(req: Request) {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    const body: unknown = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { emails } = parsed.data;
    if (emails.length === 0) {
        return NextResponse.json({ actions: [] });
    }

    const emailIds = emails.map((e) => e.id);

    // Which emails have already been processed?
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
    const toProcess = emails.filter((e) => !processedSet.has(e.id));

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

        const useAI = profile?.use_ai_email ?? false;

        const extractedMap = useAI
            ? await extractEmailActions(toProcess as EmailInput[], {
                  ...(profile?.anthropic_api_key
                      ? { apiKey: profile.anthropic_api_key }
                      : {}),
              })
            : new Map<string, never>();

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
                });
            }
        }

        if (rows.length > 0) {
            await supabaseAdmin
                .from('email_actions')
                .upsert(rows, { onConflict: 'user_id,email_id,title' });
        }
    }

    const { data: allActions } = await supabase
        .from('email_actions')
        .select('*')
        .eq('user_id', user.id)
        .in('email_id', emailIds)
        .eq('completed', false)
        .order('due_date', { ascending: true, nullsFirst: false });

    return NextResponse.json({ actions: allActions ?? [] });
}
