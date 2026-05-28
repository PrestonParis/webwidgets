import type { SupabaseClient } from '@supabase/supabase-js';
import { executeUnifiedAction } from '@/features/actions/lib/actionEngine';
import type {
    ActionRequest,
    ActionResult,
} from '@/features/actions/types/actions';

export async function executeActionRequest(
    supabase: SupabaseClient,
    request: ActionRequest,
): Promise<ActionResult> {
    const engineResult = await executeUnifiedAction(
        {
            actionId: request.actionId,
            sourceWidgetId: request.sourceWidgetId,
            payload: request.payload,
            approvalState: request.approvalState,
            invocationMode: 'auto',
        },
        { supabase, userId: request.userId },
    );

    return {
        ok: engineResult.status !== 'failed',
        message:
            engineResult.status === 'failed'
                ? engineResult.message
                : engineResult.status === 'deferred'
                  ? 'Action deferred to background queue'
                  : 'Action completed',
        engineResult,
    };
}
