import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { z } from 'zod';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';

const requestSchema = z.object({
    actionIds: z.array(z.string().min(1)).min(1).max(100),
});

export async function POST(req: Request) {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    const body: unknown = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { actionIds } = parsed.data;

    const { data: rawActions, error: fetchError } = await supabaseAdmin
        .from('email_actions')
        .select('id, type, title, description, due_date')
        .eq('user_id', user.id)
        .in('id', actionIds);

    if (fetchError) {
        console.error('[confirm] fetch actions failed:', fetchError.message);
        return NextResponse.json(
            { error: 'Failed to fetch actions' },
            { status: 500 },
        );
    }

    const actions = (rawActions ?? []) as {
        id: string;
        type: string;
        title: string;
        description: string | null;
        due_date: string | null;
    }[];

    if (actions.length === 0) {
        return NextResponse.json({ ok: true });
    }

    // Insert todos for action / deadline types (todos table: id, user_id, text, completed, created_at, completed_at)
    const todoRows = actions
        .filter((a) => a.type === 'action' || a.type === 'deadline')
        .map((a) => ({
            user_id: user.id,
            text: a.description ? `${a.title} — ${a.description}` : a.title,
        }));

    if (todoRows.length > 0) {
        const { error: todoError } = await supabaseAdmin
            .from('todos')
            .insert(todoRows);
        if (todoError) {
            console.error('[confirm] todo insert failed:', todoError.message);
        } else {
            console.log(`[confirm] inserted ${todoRows.length} todos`);
        }
    }

    // Create Google Calendar events for event-type actions
    const eventActions = actions.filter((a) => a.type === 'event');
    if (eventActions.length > 0) {
        try {
            const tokens = await getGoogleTokens(supabaseAdmin, user.id);
            const auth = createGmailClient(tokens);
            const calendarEvents = google.calendar({
                version: 'v3',
                auth,
            }).events;

            for (const a of eventActions) {
                try {
                    const today = new Date().toISOString().slice(0, 10);
                    const isAllDay =
                        !a.due_date || /T00:00:00(\.000)?Z$/.test(a.due_date);
                    const dateOnly = a.due_date
                        ? a.due_date.slice(0, 10)
                        : today;
                    const start = isAllDay
                        ? { date: dateOnly }
                        : { dateTime: a.due_date! };
                    const end = isAllDay
                        ? { date: dateOnly }
                        : {
                              dateTime: new Date(
                                  new Date(a.due_date!).getTime() + 3_600_000,
                              ).toISOString(),
                          };
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
                    await calendarEvents.insert({
                        calendarId: 'primary',
                        requestBody: {
                            summary: a.title,
                            ...(a.description
                                ? { description: a.description }
                                : {}),
                            start,
                            end,
                        },
                    });
                    console.log(`[confirm] created calendar event: ${a.title}`);
                } catch (e) {
                    console.error('[confirm] calendar event failed:', e);
                }
            }
        } catch {
            console.warn('[confirm] calendar not connected, skipping events');
        }
    }

    // Mark confirmed in DB
    const { error: syncError } = await supabaseAdmin
        .from('email_actions')
        .update({ synced: true })
        .in('id', actionIds);

    if (syncError) {
        console.error('[confirm] mark synced failed:', syncError.message);
    }

    return NextResponse.json({ ok: true, confirmed: actions.length });
}
