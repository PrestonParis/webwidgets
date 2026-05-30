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

type Clients = Awaited<ReturnType<typeof createClients>>;
type SupabaseAdmin = Clients['supabaseAdmin'];
type CalendarEvents = ReturnType<typeof google.calendar>['events'];

interface ActionToConfirm {
    id: string;
    type: string;
    title: string;
    description: string | null;
    due_date: string | null;
}

type ParsedRequest =
    | { ok: true; actionIds: string[] }
    | { ok: false; response: NextResponse };

async function parseActionIds(req: Request): Promise<ParsedRequest> {
    const body: unknown = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
        return {
            ok: false,
            response: NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 },
            ),
        };
    }
    return { ok: true, actionIds: parsed.data.actionIds };
}

async function fetchActionsToConfirm(
    supabaseAdmin: SupabaseAdmin,
    userId: string,
    actionIds: string[],
): Promise<ActionToConfirm[] | NextResponse> {
    const { data: rawActions, error: fetchError } = await supabaseAdmin
        .from('email_actions')
        .select('id, type, title, description, due_date')
        .eq('user_id', userId)
        .in('id', actionIds);

    if (!fetchError) return (rawActions ?? []) as ActionToConfirm[];

    console.error('[confirm] fetch actions failed:', fetchError.message);
    return NextResponse.json(
        { error: 'Failed to fetch actions' },
        { status: 500 },
    );
}

async function insertTodos(
    supabaseAdmin: SupabaseAdmin,
    userId: string,
    actions: ActionToConfirm[],
): Promise<void> {
    const todoRows = actions
        .filter((a) => a.type === 'action' || a.type === 'deadline')
        .map((a) => ({
            user_id: userId,
            text: a.description ? `${a.title}: ${a.description}` : a.title,
        }));

    if (todoRows.length === 0) return;

    const { error: todoError } = await supabaseAdmin
        .from('todos')
        .insert(todoRows);
    if (todoError) {
        console.error('[confirm] todo insert failed:', todoError.message);
    } else {
        console.log(`[confirm] inserted ${todoRows.length} todos`);
    }
}

function getCalendarTimes(action: ActionToConfirm) {
    const today = new Date().toISOString().slice(0, 10);
    const isAllDay =
        !action.due_date || /T00:00:00(\.000)?Z$/.test(action.due_date);
    const dateOnly = action.due_date ? action.due_date.slice(0, 10) : today;

    if (isAllDay) return { start: { date: dateOnly }, end: { date: dateOnly } };

    return {
        start: { dateTime: action.due_date! },
        end: {
            dateTime: new Date(
                new Date(action.due_date!).getTime() + 3_600_000,
            ).toISOString(),
        },
    };
}

async function insertCalendarEvent(
    calendarEvents: CalendarEvents,
    action: ActionToConfirm,
): Promise<void> {
    const { start, end } = getCalendarTimes(action);
    await calendarEvents.insert({
        calendarId: 'primary',
        requestBody: {
            summary: action.title,
            ...(action.description ? { description: action.description } : {}),
            start,
            end,
        },
    });
    console.log(`[confirm] created calendar event: ${action.title}`);
}

async function createCalendarEvents(
    supabaseAdmin: SupabaseAdmin,
    userId: string,
    actions: ActionToConfirm[],
): Promise<void> {
    const eventActions = actions.filter((a) => a.type === 'event');
    if (eventActions.length === 0) return;

    try {
        const tokens = await getGoogleTokens(supabaseAdmin, userId);
        const auth = createGmailClient(tokens);
        const calendarEvents = google.calendar({ version: 'v3', auth }).events;

        for (const action of eventActions) {
            try {
                await insertCalendarEvent(calendarEvents, action);
            } catch (e) {
                console.error('[confirm] calendar event failed:', e);
            }
        }
    } catch {
        console.warn('[confirm] calendar not connected, skipping events');
    }
}

async function markActionsSynced(
    supabaseAdmin: SupabaseAdmin,
    actionIds: string[],
): Promise<void> {
    const { error: syncError } = await supabaseAdmin
        .from('email_actions')
        .update({ synced: true })
        .in('id', actionIds);

    if (syncError) {
        console.error('[confirm] mark synced failed:', syncError.message);
    }
}

export async function POST(req: Request) {
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    const parsed = await parseActionIds(req);
    if (!parsed.ok) return parsed.response;

    const { actionIds } = parsed;
    const actions = await fetchActionsToConfirm(
        supabaseAdmin,
        user.id,
        actionIds,
    );
    if (actions instanceof NextResponse) return actions;
    if (actions.length === 0) {
        return NextResponse.json({ ok: true });
    }

    await insertTodos(supabaseAdmin, user.id, actions);
    await createCalendarEvents(supabaseAdmin, user.id, actions);
    await markActionsSynced(supabaseAdmin, actionIds);

    return NextResponse.json({ ok: true, confirmed: actions.length });
}
