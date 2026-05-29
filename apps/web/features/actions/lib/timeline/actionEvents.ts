import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/supabase';
import { recordAuditEvent } from '@/features/audit/lib/auditService';
import { getLogger } from '@/lib/observability/logger';
import type { ActionExecutionContext } from '@/features/actions/lib/schemas/actionPayloadSchemas';
import type { ActionEngineResult } from '@/features/actions/lib/schemas/actionResultSchemas';
import { persistActionExecution } from '@/features/actions/lib/timeline/actionPersistence';

export async function emitActionLifecycleEvent(input: {
    supabase?: SupabaseClient;
    context: ActionExecutionContext;
    result: ActionEngineResult;
    payload?: unknown;
}) {
    const { context, result } = input;
    getLogger({
        component: 'action-timeline',
        actionId: context.actionId,
        userId: context.userId,
        status: result.status,
    }).info('action lifecycle event emitted');

    if (!input.supabase) return;

    await persistActionExecution({
        supabase: input.supabase,
        context,
        payload: input.payload ?? {},
        result,
    });

    await recordAuditEvent(input.supabase, {
        userId: context.userId,
        type: `action.${result.status}`,
        source: 'actions',
        severity: result.status === 'failed' ? 'warning' : 'info',
        title: `Action ${result.status}: ${context.actionId}`,
        metadata: {
            actionId: context.actionId,
            requestId: context.requestId,
            result,
        } as Json,
        relatedEntityIds: [context.requestId],
    });
}
