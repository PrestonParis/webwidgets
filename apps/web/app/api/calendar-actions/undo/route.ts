import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';
import { calendarActionPayloadSchema } from '@/lib/calendarActions/contracts';
import { googleCalendarTransport } from '@/lib/calendarActions/googleCalendarTransport';
import { undoCalendarCreate } from '@/lib/calendarActions/googleCalendarAdapter';
import { loadCalendarActionToken } from '../_lib/googleCredentials';
import { calendarActionError, requireCalendarMutation } from '../_lib/http';
const undoSchema = z.object({
    userId: z.uuid(),
    accountId: z.uuid(),
    eventId: z.string().min(1),
    payload: calendarActionPayloadSchema,
});
export async function POST(request: Request) {
    try {
        requireCalendarMutation(request);
        const { supabase, supabaseAdmin, userId } =
            await createCredentialClients();
        const { id } = z
            .strictObject({ id: z.uuid() })
            .parse(await request.json());
        const begun = await supabase.rpc('begin_calendar_action_undo', {
            p_request_id: id,
        });
        if (begun.error) throw new Error(begun.error.message);
        const undo = undoSchema.parse(begun.data);
        if (undo.userId !== userId || undo.accountId !== undo.payload.accountId)
            throw new Error('calendar_undo_forbidden');
        const token = await loadCalendarActionToken(
            supabaseAdmin,
            userId,
            undo.payload,
        );
        const deleted = await undoCalendarCreate(
            googleCalendarTransport(token),
            undo.eventId,
        );
        const recorded = await supabaseAdmin.rpc(
            'record_calendar_action_undo',
            { p_request_id: id, p_user_id: userId, p_deleted: deleted },
        );
        if (recorded.error) throw new Error('calendar_undo_persistence_failed');
        return NextResponse.json({ cancelled: deleted });
    } catch (error) {
        return calendarActionError(error);
    }
}
