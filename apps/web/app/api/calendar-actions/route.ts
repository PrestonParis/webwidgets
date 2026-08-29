import { NextResponse } from 'next/server';
import { createCredentialClients } from '@/app/api/auth/_lib/credentialClients';
import { calendarProposalSchema } from '@/lib/calendarActions/contracts';
import {
    calendarRequestSchema,
    calendarWorkspaceSchema,
} from '@/lib/calendarActions/receipts';
import { hashJson } from '@/lib/lifecycle/idempotency';
import { calendarActionError, requireCalendarMutation } from './_lib/http';
export async function GET() {
    try {
        const { supabaseAdmin, userId } = await createCredentialClients();
        const [accounts, requests, outcomes] = await Promise.all([
            supabaseAdmin
                .from('user_email_accounts')
                .select('id,email,granted_scopes')
                .eq('user_id', userId)
                .eq('provider', 'google'),
            supabaseAdmin
                .from('action_requests')
                .select('*')
                .eq('user_id', userId)
                .eq('action_id', 'calendar.create_event')
                .order('requested_at', { ascending: false })
                .limit(20),
            supabaseAdmin
                .from('calendar_action_dispatches')
                .select('action_request_id,receipt,undo_state')
                .eq('user_id', userId)
                .order('reserved_at', { ascending: false })
                .limit(20),
        ]);
        if (accounts.error || requests.error || outcomes.error)
            throw new Error('calendar_workspace_unavailable');
        return NextResponse.json(
            calendarWorkspaceSchema.parse({
                enabled: process.env.PROVIDER_ACTIONS_ENABLED === 'true',
                accounts: accounts.data,
                requests: requests.data,
                outcomes: outcomes.data,
            }),
            { headers: { 'Cache-Control': 'no-store' } },
        );
    } catch (error) {
        return calendarActionError(error);
    }
}
export async function POST(request: Request) {
    try {
        requireCalendarMutation(request);
        const { supabaseAdmin, userId } = await createCredentialClients();
        const input = calendarProposalSchema.parse(await request.json());
        const result = await supabaseAdmin.rpc('propose_calendar_action', {
            p_user_id: userId,
            p_payload: input.event,
            p_payload_hash: await hashJson(input.event),
            p_idempotency_key: input.idempotencyKey,
        });
        if (result.error) throw new Error(result.error.message);
        return NextResponse.json(calendarRequestSchema.parse(result.data), {
            status: 201,
        });
    } catch (error) {
        return calendarActionError(error);
    }
}
