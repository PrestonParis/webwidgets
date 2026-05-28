import type { SupabaseClient } from '@supabase/supabase-js';
import {
    actionExecutionContextSchema,
    type ActionRequestEnvelope,
} from '@/features/actions/schemas/actionPayloadSchemas';

export interface ActionRuntimeContext {
    supabase?: SupabaseClient;
    userId: string;
}

export function createActionExecutionContext(input: {
    envelope: ActionRequestEnvelope;
    runtime: ActionRuntimeContext;
}) {
    return actionExecutionContextSchema.parse({
        userId: input.runtime.userId,
        actionId: input.envelope.actionId,
        requestId: input.envelope.correlationId ?? crypto.randomUUID(),
        sourceWidgetId: input.envelope.sourceWidgetId,
        approvalState: input.envelope.approvalState,
        invocationMode: input.envelope.invocationMode,
        startedAt: new Date(),
    });
}
