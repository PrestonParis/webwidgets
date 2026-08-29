import { z } from 'zod';
import type { CalendarActionPayload } from '@/lib/calendarActions/contracts';
import {
    calendarRequestSchema,
    calendarWorkspaceSchema,
    type CalendarActionRequest,
} from '@/lib/calendarActions/receipts';
async function call(path: string, body?: unknown) {
    const response = await fetch(`/api/calendar-actions${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        cache: 'no-store',
    });
    const data: unknown = await response.json();
    if (!response.ok) {
        const parsed = z.object({ error: z.string() }).safeParse(data);
        throw new Error(
            parsed.success ? parsed.data.error : 'calendar_action_failed',
        );
    }
    return data;
}
export async function loadCalendarActions() {
    return calendarWorkspaceSchema.parse(await call(''));
}
export async function proposeCalendar(
    event: CalendarActionPayload,
    key: string,
) {
    return calendarRequestSchema.parse(
        await call('', {
            actionId: 'calendar.create_event',
            idempotencyKey: key,
            event,
        }),
    );
}
export async function decideCalendar(
    action: CalendarActionRequest,
    decision: 'approved' | 'denied',
) {
    return z
        .object({ request: calendarRequestSchema, queued: z.boolean() })
        .parse(
            await call('/approve', {
                actionRequestId: action.id,
                actionId: action.action_id,
                payloadVersion: action.payload_version,
                payloadHash: action.payload_hash,
                event: action.payload,
                decision,
            }),
        );
}
export async function reconcileCalendar(id: string) {
    await call('/reconcile', { id });
}
export async function undoCalendar(id: string) {
    return z
        .object({ cancelled: z.boolean() })
        .parse(await call('/undo', { id }));
}
