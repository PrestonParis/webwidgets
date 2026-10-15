import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { emailWorkspaceSchema } from '@/lib/emailActions/receipts';

export function requireEmailMutation(request: Request) {
    if (process.env.EMAIL_ACTIONS_ENABLED !== 'true')
        throw new Error('email_actions_not_enabled');
    if (request.headers.get('origin') !== new URL(request.url).origin)
        throw new Error('email_origin_forbidden');
}

export function emailActionError(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    const code = [
        'email_actions_not_enabled',
        'email_permission_upgrade_required',
        'email_rate_limited',
        'email_account_unavailable',
        'email_provider_not_enabled',
        'email_action_stale_approval',
        'email_idempotency_conflict',
        'email_origin_forbidden',
    ].includes(message)
        ? message
        : 'email_action_rejected';
    return NextResponse.json(
        { error: code },
        { status: message === 'Unauthorized' ? 401 : 409 },
    );
}

export async function emailWorkspace(db: SupabaseClient, userId: string) {
    const [accounts, requests, outcomes] = await Promise.all([
        db
            .from('user_email_accounts')
            .select('id,provider,email,granted_scopes')
            .eq('user_id', userId)
            .order('provider'),
        db
            .from('action_requests')
            .select(
                'id,action_id,payload,payload_hash,payload_version,approval_state,status,requested_at,expires_at,failure_code',
            )
            .eq('user_id', userId)
            .in('action_id', ['email.draft', 'email.send'])
            .order('requested_at', { ascending: false })
            .limit(20),
        db
            .from('email_action_dispatches')
            .select('action_request_id,receipt')
            .eq('user_id', userId)
            .order('reserved_at', { ascending: false })
            .limit(20),
    ]);
    if (accounts.error || requests.error || outcomes.error)
        throw new Error('email_workspace_unavailable');
    return emailWorkspaceSchema.parse({
        enabled: process.env.EMAIL_ACTIONS_ENABLED === 'true',
        accounts: accounts.data,
        requests: requests.data,
        outcomes: outcomes.data,
    });
}
