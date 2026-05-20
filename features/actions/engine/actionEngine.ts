import type { SupabaseClient } from '@supabase/supabase-js';
import { ZodError } from 'zod';
import { getLogger, traced } from '@/lib/observability/logger';
import { captureError } from '@/lib/observability/sentry';
import { getActionDefinition } from '@/features/actions/registry/actionRegistry';
import { executeActionHandler } from '@/features/actions/execution/actionHandlers';
import { evaluateActionGate } from '@/features/actions/permissions/actionGates';
import {
    enqueueActionJob,
    actionQueueName,
} from '@/features/actions/queue/actionQueue';
import { createActionExecutionContext } from '@/features/actions/runtime/executionContext';
import { handleRuntimeState } from '@/features/actions/runtime/stateMachine';
import { emitActionLifecycleEvent } from '@/features/actions/timeline/actionEvents';
import {
    actionEngineResultSchema,
    actionRequestEnvelopeSchema,
    deserializeActionPayload,
    serializeActionPayload,
    type ActionEngineResult,
    type ActionRequestEnvelope,
} from '@/features/actions/schemas/actionSchemas';

export interface ExecuteUnifiedActionRuntime {
    userId: string;
    supabase?: SupabaseClient;
}

function shouldQueue(envelope: ActionRequestEnvelope, queueability: string) {
    if (envelope.invocationMode === 'sync') return false;
    if (envelope.invocationMode === 'queued') return true;
    return queueability === 'required';
}

function zodIssues(error: unknown) {
    return error instanceof ZodError
        ? JSON.stringify(error.flatten())
        : undefined;
}

export async function executeUnifiedAction(
    rawEnvelope: unknown,
    runtime: ExecuteUnifiedActionRuntime,
): Promise<ActionEngineResult> {
    const started = performance.now();
    const log = getLogger({
        component: 'unified-action-engine',
        userId: runtime.userId,
    });

    return traced(
        'actions.engine.execute',
        async () => {
            const serialized =
                typeof rawEnvelope === 'string'
                    ? rawEnvelope
                    : serializeActionPayload(rawEnvelope);
            const deserialized =
                typeof rawEnvelope === 'string'
                    ? deserializeActionPayload(serialized)
                    : rawEnvelope;

            const envelopeResult =
                actionRequestEnvelopeSchema.safeParse(deserialized);
            if (!envelopeResult.success) {
                const result = {
                    status: 'failed' as const,
                    code: 'ValidationError' as const,
                    message:
                        zodIssues(envelopeResult.error) ??
                        'Invalid action request envelope',
                    durationMs: performance.now() - started,
                };
                return handleRuntimeState({ state: 'Failed', result });
            }

            const envelope = envelopeResult.data;
            const definition = getActionDefinition(envelope.actionId);
            if (!definition) {
                return handleRuntimeState({
                    state: 'Failed',
                    result: {
                        status: 'failed',
                        actionId: envelope.actionId,
                        code: 'UnknownAction',
                        message: `Unknown action: ${envelope.actionId}`,
                        durationMs: performance.now() - started,
                    },
                });
            }

            const context = createActionExecutionContext({ envelope, runtime });
            const inputResult = definition.expectedInputs.safeParse(
                envelope.payload,
            );
            if (!inputResult.success) {
                const result = {
                    status: 'failed' as const,
                    actionId: definition.id,
                    code: 'ValidationError' as const,
                    message:
                        zodIssues(inputResult.error) ??
                        'Action input validation failed',
                    durationMs: performance.now() - started,
                };
                await emitActionLifecycleEvent({
                    supabase: runtime.supabase,
                    context,
                    result,
                    payload: envelope.payload,
                });
                return handleRuntimeState({ state: 'Failed', result });
            }

            const gateResult = evaluateActionGate(definition, context);
            if (gateResult.isErr()) {
                const result = {
                    status: 'failed' as const,
                    actionId: definition.id,
                    code: gateResult.error.code,
                    message: gateResult.error.message,
                    durationMs: performance.now() - started,
                };
                await emitActionLifecycleEvent({
                    supabase: runtime.supabase,
                    context,
                    result,
                    payload: envelope.payload,
                });
                return handleRuntimeState({
                    state: 'BlockedByGate',
                    actionId: definition.id,
                    reason: result.message,
                });
            }

            if (shouldQueue(envelope, definition.queueability)) {
                const job = await enqueueActionJob(envelope, runtime.userId);
                if (!job) {
                    const result = {
                        status: 'failed' as const,
                        actionId: definition.id,
                        code: 'QueueUnavailable' as const,
                        message:
                            'Action requires background queue but Redis is not configured',
                        durationMs: performance.now() - started,
                    };
                    await emitActionLifecycleEvent({
                        supabase: runtime.supabase,
                        context,
                        result,
                        payload: envelope.payload,
                    });
                    return handleRuntimeState({ state: 'Failed', result });
                }

                const result = actionEngineResultSchema.parse({
                    status: 'deferred',
                    actionId: definition.id,
                    jobId: String(job.id),
                    queueName: actionQueueName,
                    enqueuedAt: new Date(),
                });
                await emitActionLifecycleEvent({
                    supabase: runtime.supabase,
                    context,
                    result,
                    payload: envelope.payload,
                });
                return handleRuntimeState({ state: 'Success', result });
            }

            const handlerResult = await executeActionHandler({
                definition,
                context,
                input: inputResult.data,
            });

            if (handlerResult.isErr()) {
                captureError(handlerResult.error.cause ?? handlerResult.error, {
                    userId: runtime.userId,
                    feature: 'actions',
                    operation: definition.id,
                });
                const result = {
                    status: 'failed' as const,
                    actionId: definition.id,
                    code: handlerResult.error.code,
                    message: handlerResult.error.message,
                    durationMs: performance.now() - started,
                };
                await emitActionLifecycleEvent({
                    supabase: runtime.supabase,
                    context,
                    result,
                    payload: envelope.payload,
                });
                return handleRuntimeState({ state: 'Failed', result });
            }

            const outputResult = definition.expectedOutputs.safeParse(
                handlerResult.value,
            );
            if (!outputResult.success) {
                const result = {
                    status: 'failed' as const,
                    actionId: definition.id,
                    code: 'OutputMalformation' as const,
                    message:
                        zodIssues(outputResult.error) ??
                        'Action output validation failed',
                    durationMs: performance.now() - started,
                };
                await emitActionLifecycleEvent({
                    supabase: runtime.supabase,
                    context,
                    result,
                    payload: envelope.payload,
                });
                return handleRuntimeState({ state: 'Failed', result });
            }

            const result = actionEngineResultSchema.parse({
                status: 'completed',
                actionId: definition.id,
                output: outputResult.data,
                durationMs: performance.now() - started,
            });
            log.info(
                { actionId: definition.id, durationMs: result.durationMs },
                'action completed',
            );
            await emitActionLifecycleEvent({
                supabase: runtime.supabase,
                context,
                result,
                payload: envelope.payload,
            });
            return handleRuntimeState({ state: 'Success', result });
        },
        { userId: runtime.userId },
    );
}
