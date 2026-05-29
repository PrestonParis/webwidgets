import { match } from 'ts-pattern';
import type { ActionEngineResult } from '@/features/actions/lib/schemas/actionResultSchemas';
import { getLogger } from '@/lib/observability/logger';
import { recordActionResult } from '@/features/actions/lib/telemetry';

export type ActionRuntimeState =
    | { state: 'Success'; result: ActionEngineResult }
    | { state: 'Failed'; result: ActionEngineResult }
    | { state: 'Retrying'; actionId: string; attempt: number }
    | { state: 'BlockedByGate'; actionId: string; reason: string };

export function handleRuntimeState(runtimeState: ActionRuntimeState) {
    const log = getLogger({ component: 'action-state-machine' });
    return match(runtimeState)
        .with({ state: 'Success' }, ({ result }) => {
            recordActionResult(result);
            log.info({ status: result.status }, 'action runtime success');
            return result;
        })
        .with({ state: 'Failed' }, ({ result }) => {
            recordActionResult(result);
            log.warn({ result }, 'action runtime failed');
            return result;
        })
        .with({ state: 'Retrying' }, ({ actionId, attempt }) => {
            log.info({ actionId, attempt }, 'action runtime retrying');
            return {
                status: 'failed' as const,
                actionId,
                code: 'ExecutionFault' as const,
                message: 'Retry scheduled',
            };
        })
        .with({ state: 'BlockedByGate' }, ({ actionId, reason }) => {
            log.warn({ actionId, reason }, 'action blocked by gate');
            const result = {
                status: 'failed' as const,
                actionId,
                code: 'PermissionDenied' as const,
                message: reason,
            };
            recordActionResult(result);
            return result;
        })
        .exhaustive();
}
