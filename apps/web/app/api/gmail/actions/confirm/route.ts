import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { z } from 'zod';
import { createCredentialClients as createClients } from '@/app/api/auth/_lib/credentialClients';
import { omitUndefined } from '@/features/backend/lib/exactOptional';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { getGoogleTokens } from '@/lib/supabase/getGoogleTokens';
import { createGmailClient } from '@/features/inbox/lib/client';
import {
    ingestEmailActionCalendarContext,
    ingestEmailActionTodoContext,
} from '@/features/context/services/contextProducerService';

const requestSchema = z.object({
    actionIds: z.array(z.string().min(1)).min(1).max(100),
});

type Clients = Awaited<ReturnType<typeof createClients>>;
type SupabaseAdmin = Clients['supabaseAdmin'];
type CalendarEvents = ReturnType<typeof google.calendar>['events'];

interface ActionToConfirm {
    id: string;
    email_id: string;
    type: string;
    title: string;
    description: string | null;
    due_date: string | null;
}

interface CreatedTodoFromAction {
    action: ActionToConfirm;
    todo: { id: string; text: string };
}

interface CreatedCalendarEventFromAction {
    action: ActionToConfirm;
    event: { id?: string | null; htmlLink?: string | null };
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
        .select('id, email_id, type, title, description, due_date')
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
): Promise<CreatedTodoFromAction[]> {
    const todoActions = actions.filter(
        (a) => a.type === 'action' || a.type === 'deadline',
    );
    const todoRows = todoActions.map((a) => ({
        user_id: userId,
        text: a.description ? `${a.title}: ${a.description}` : a.title,
    }));

    if (todoRows.length === 0) return [];

    const { data, error: todoError } = await supabaseAdmin
        .from('todos')
        .insert(todoRows)
        .select('id, text');
    if (todoError) {
        console.error('[confirm] todo insert failed:', todoError.message);
        return [];
    } else {
        console.log(`[confirm] inserted ${todoRows.length} todos`);
    }
    return ((data ?? []) as { id: string; text: string }[]).map(
        (todo, index) => ({
            todo,
            action: todoActions[index]!,
        }),
    );
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
): Promise<CreatedCalendarEventFromAction | null> {
    const { start, end } = getCalendarTimes(action);
    const { data } = await calendarEvents.insert({
        calendarId: 'primary',
        requestBody: {
            summary: action.title,
            ...(action.description ? { description: action.description } : {}),
            start,
            end,
        },
    });
    console.log(`[confirm] created calendar event: ${action.title}`);
    return { action, event: data };
}

async function createCalendarEvents(
    supabaseAdmin: SupabaseAdmin,
    userId: string,
    actions: ActionToConfirm[],
): Promise<CreatedCalendarEventFromAction[]> {
    const eventActions = actions.filter((a) => a.type === 'event');
    if (eventActions.length === 0) return [];

    try {
        const tokens = await getGoogleTokens(supabaseAdmin, userId);
        const auth = createGmailClient(tokens);
        const calendarEvents = google.calendar({ version: 'v3', auth }).events;
        const created: CreatedCalendarEventFromAction[] = [];

        for (const action of eventActions) {
            try {
                const event = await insertCalendarEvent(calendarEvents, action);
                if (event?.event.id) created.push(event);
            } catch (e) {
                console.error('[confirm] calendar event failed:', e);
            }
        }
        return created;
    } catch {
        console.warn('[confirm] calendar not connected, skipping events');
        return [];
    }
}

async function markActionsSynced(
    supabaseAdmin: SupabaseAdmin,
    userId: string,
    actionIds: string[],
): Promise<void> {
    const { error: syncError } = await supabaseAdmin
        .from('email_actions')
        .update({ synced: true })
        .eq('user_id', userId)
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

    const [createdTodos, createdCalendarEvents] = await Promise.all([
        insertTodos(supabaseAdmin, user.id, actions),
        createCalendarEvents(supabaseAdmin, user.id, actions),
    ]);
    await Promise.allSettled([
        ...createdTodos.map(({ action, todo }) =>
            ingestEmailActionTodoContext(supabaseAdmin, user.id, {
                actionId: action.id,
                emailId: action.email_id,
                todoId: todo.id,
                title: todo.text,
                description: action.description,
                dueDate: action.due_date,
                actionType: action.type,
            }),
        ),
        ...createdCalendarEvents.map(({ action, event }) =>
            ingestEmailActionCalendarContext(
                supabaseAdmin,
                user.id,
                omitUndefined({
                    actionId: action.id,
                    emailId: action.email_id,
                    eventId: event.id!,
                    title: action.title,
                    description: action.description,
                    start: action.due_date,
                    htmlLink: event.htmlLink,
                }),
            ),
        ),
    ]);
    await markActionsSynced(supabaseAdmin, user.id, [
        ...createdTodos.map(({ action }) => action.id),
        ...createdCalendarEvents.map(({ action }) => action.id),
    ]);

    return NextResponse.json({
        ok: true,
        confirmed: actions.length,
        todosCreated: createdTodos.length,
        calendarEventsCreated: createdCalendarEvents.length,
    });
}
