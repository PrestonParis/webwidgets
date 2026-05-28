import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/supabase';
import { getLogger } from '@/lib/observability/logger';
import type { ActionExecutionContext } from '@/features/actions/lib/schemas/actionPayloadSchemas';
import {
    insertActionExecutionSchema,
    type ActionEngineResult,
} from '@/features/actions/lib/schemas/actionResultSchemas';

export async function persistActionExecution(input: {
    supabase?: SupabaseClient;
    context: ActionExecutionContext;
    payload: unknown;
    result: ActionEngineResult;
}) {
    if (!input.supabase) return;

    const completedAt = new Date();
    const execution = insertActionExecutionSchema.parse({
        id: input.context.requestId,
        userId: input.context.userId,
        actionId: input.context.actionId,
        sourceWidgetId: input.context.sourceWidgetId,
        status: input.result.status,
        queueable: input.result.status === 'deferred',
        payload: input.payload as Json,
        output:
            input.result.status === 'completed'
                ? (input.result.output as Json)
                : null,
        error: input.result.status === 'failed' ? (input.result as Json) : null,
        startedAt: input.context.startedAt,
        completedAt,
    });

    const result = await input.supabase.from('action_requests').insert({
        id: execution.id,
        user_id: execution.userId,
        action_id: execution.actionId,
        source_widget_id: execution.sourceWidgetId,
        payload: execution.payload,
        approval_state: input.context.approvalState,
        status: execution.status,
    });

    if (result.error) {
        getLogger({
            component: 'action-persistence',
            actionId: input.context.actionId,
        }).warn({ err: result.error }, 'action execution persistence failed');
    }
}
