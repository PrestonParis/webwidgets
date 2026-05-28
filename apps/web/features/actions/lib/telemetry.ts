import {
    actionExecutionDuration,
    actionExecutionsTotal,
    actionQueueLatency,
} from '@/lib/observability/metrics';
import type { ActionEngineResult } from '@/features/actions/lib/schemas/actionResultSchemas';

export function recordActionResult(result: ActionEngineResult) {
    const actionId = result.actionId ?? 'unknown';
    actionExecutionsTotal.inc({ action_id: actionId, status: result.status });
    if ('durationMs' in result && typeof result.durationMs === 'number') {
        actionExecutionDuration.observe(
            { action_id: actionId, status: result.status },
            result.durationMs / 1000,
        );
    }
}

export function recordActionQueueLatency(actionId: string, latencyMs: number) {
    actionQueueLatency.observe({ action_id: actionId }, latencyMs / 1000);
}
