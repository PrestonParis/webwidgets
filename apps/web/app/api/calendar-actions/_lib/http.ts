import { NextResponse } from 'next/server';
export function requireCalendarMutation(request: Request) {
    if (process.env.PROVIDER_ACTIONS_ENABLED !== 'true')
        throw new Error('provider_actions_not_enabled');
    if (request.headers.get('origin') !== new URL(request.url).origin)
        throw new Error('calendar_origin_forbidden');
}
export function calendarActionError(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    const allowed = [
        'provider_actions_not_enabled',
        'calendar_permission_required',
        'calendar_account_unavailable',
        'calendar_rate_limited',
        'calendar_action_stale_approval',
        'calendar_idempotency_conflict',
        'calendar_undo_unavailable',
    ];
    return NextResponse.json(
        {
            error: allowed.includes(message)
                ? message
                : 'calendar_action_rejected',
        },
        { status: message === 'Unauthorized' ? 401 : 409 },
    );
}
