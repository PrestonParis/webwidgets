import { NextResponse } from 'next/server';
export function requireWorkflowMutation(request: Request) {
    if (process.env.PROVIDER_ACTIONS_ENABLED !== 'true')
        throw new Error('provider_actions_not_enabled');
    if (request.headers.get('origin') !== new URL(request.url).origin)
        throw new Error('workflow_origin_forbidden');
}
export function workflowActionError(error: unknown) {
    const message = error instanceof Error ? error.message : '';
    const allowed = [
        'provider_actions_not_enabled',
        'workflow_config_unavailable',
        'workflow_consent_required',
        'workflow_rate_limited',
        'workflow_action_stale_approval',
        'workflow_idempotency_conflict',
    ];
    return NextResponse.json(
        {
            error: allowed.includes(message)
                ? message
                : 'workflow_action_rejected',
        },
        { status: message === 'Unauthorized' ? 401 : 409 },
    );
}
