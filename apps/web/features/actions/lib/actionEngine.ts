import type { SupabaseClient } from '@supabase/supabase-js';
import { ZodError } from 'zod';
import { getLogger, traced } from '@/lib/observability/logger';
import { captureError } from '@/lib/observability/sentry';
import { getActionDefinition } from '@/features/actions/lib/actionRegistry';
import type { ActionDefinition } from '@/features/actions/lib/schemas/definitionSchemas';
import { executeActionHandler } from '@/features/actions/lib/actionHandlers';
import { evaluateActionGate } from '@/features/actions/lib/actionGates';
import { createActionExecutionContext } from '@/features/actions/lib/executionContext';
import { handleRuntimeState } from '@/features/actions/lib/stateMachine';
import { emitActionLifecycleEvent } from '@/features/actions/lib/timeline/actionEvents';
import {
    actionRequestEnvelopeSchema,
    deserializeActionPayload,
    serializeActionPayload,
    type ActionExecutionContext,
    type ActionRequestEnvelope,
} from '@/features/actions/lib/schemas/actionPayloadSchemas';
import {
    actionEngineResultSchema,
    type ActionEngineResult,
} from '@/features/actions/lib/schemas/actionResultSchemas';

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

function parseEnvelope(
    rawEnvelope: unknown,
    started: number,
):
    | { ok: true; envelope: ActionRequestEnvelope }
    | { ok: false; result: ActionEngineResult } {
    const serialized =
        typeof rawEnvelope === 'string'
            ? rawEnvelope
            : serializeActionPayload(rawEnvelope);
    const deserialized =
        typeof rawEnvelope === 'string'
            ? deserializeActionPayload(serialized)
            : rawEnvelope;
    const parsed = actionRequestEnvelopeSchema.safeParse(deserialized);
    if (!parsed.success) {
        return {
            ok: false,
            result: handleRuntimeState({
                state: 'Failed',
                result: {
                    status: 'failed',
                    code: 'ValidationError',
                    message:
                        zodIssues(parsed.error) ??
                        'Invalid action request envelope',
                    durationMs: performance.now() - started,
                },
            }),
        };
    }
    return { ok: true, envelope: parsed.data };
}

async function validateAndGateCheck(
    definition: ActionDefinition,
    envelope: ActionRequestEnvelope,
    context: ActionExecutionContext,
    runtime: ExecuteUnifiedActionRuntime,
    started: number,
): Promise<
    { ok: true; inputData: unknown } | { ok: false; result: ActionEngineResult }
> {
    const inputResult = definition.expectedInputs.safeParse(envelope.payload);
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
            ...(runtime.supabase !== undefined && {
                supabase: runtime.supabase,
            }),
            context,
            result,
            payload: envelope.payload,
        });
        return {
            ok: false,
            result: handleRuntimeState({ state: 'Failed', result }),
        };
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
            ...(runtime.supabase !== undefined && {
                supabase: runtime.supabase,
            }),
            context,
            result,
            payload: envelope.payload,
        });
        return {
            ok: false,
            result: handleRuntimeState({
                state: 'BlockedByGate',
                actionId: definition.id,
                reason: result.message,
            }),
        };
    }
    return { ok: true, inputData: inputResult.data };
}

async function executeOrQueue(
    definition: ActionDefinition,
    inputData: unknown,
    envelope: ActionRequestEnvelope,
    context: ActionExecutionContext,
    runtime: ExecuteUnifiedActionRuntime,
    started: number,
    log: ReturnType<typeof getLogger>,
): Promise<ActionEngineResult> {
    if (shouldQueue(envelope, definition.queueability)) {
        const { enqueueActionJob, actionQueueName } =
            await import('@/features/actions/lib/actionQueueClient');
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
                ...(runtime.supabase !== undefined && {
                    supabase: runtime.supabase,
                }),
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
            ...(runtime.supabase !== undefined && {
                supabase: runtime.supabase,
            }),
            context,
            result,
            payload: envelope.payload,
        });
        return handleRuntimeState({ state: 'Success', result });
    }

    const handlerResult = await executeActionHandler({
        definition,
        context,
        input: inputData,
    });
    if (handlerResult.isErr()) {
        captureError(
            ('cause' in handlerResult.error
                ? handlerResult.error.cause
                : undefined) ?? handlerResult.error,
            {
                userId: runtime.userId,
                feature: 'actions',
                operation: definition.id,
            },
        );
        const result = {
            status: 'failed' as const,
            actionId: definition.id,
            code: handlerResult.error.code,
            message: handlerResult.error.message,
            durationMs: performance.now() - started,
        };
        await emitActionLifecycleEvent({
            ...(runtime.supabase !== undefined && {
                supabase: runtime.supabase,
            }),
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
            ...(runtime.supabase !== undefined && {
                supabase: runtime.supabase,
            }),
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
        {
            actionId: definition.id,
            durationMs: (result as { durationMs: number }).durationMs,
        },
        'action completed',
    );
    await emitActionLifecycleEvent({
        ...(runtime.supabase !== undefined && { supabase: runtime.supabase }),
        context,
        result,
        payload: envelope.payload,
    });
    return handleRuntimeState({ state: 'Success', result });
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
            const parsed = parseEnvelope(rawEnvelope, started);
            if (!parsed.ok) return parsed.result;

            const definition = getActionDefinition(parsed.envelope.actionId);
            if (!definition) {
                return handleRuntimeState({
                    state: 'Failed',
                    result: {
                        status: 'failed',
                        actionId: parsed.envelope.actionId,
                        code: 'UnknownAction',
                        message: `Unknown action: ${parsed.envelope.actionId}`,
                        durationMs: performance.now() - started,
                    },
                });
            }

            const context = createActionExecutionContext({
                envelope: parsed.envelope,
                runtime,
            });
            const validated = await validateAndGateCheck(
                definition,
                parsed.envelope,
                context,
                runtime,
                started,
            );
            if (!validated.ok) return validated.result;

            return executeOrQueue(
                definition,
                validated.inputData,
                parsed.envelope,
                context,
                runtime,
                started,
                log,
            );
        },
        { userId: runtime.userId },
    );
}
