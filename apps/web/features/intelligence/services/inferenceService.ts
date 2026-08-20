import { randomUUID } from 'crypto';
import { getLogger } from '@/lib/observability/logger';
import { hashInferenceInput } from '@/features/intelligence/lib/redaction';
import { inferenceFailureDetails } from '@/features/intelligence/providers/providerError';
import { getProvidersForTask } from '@/features/intelligence/providers/providerRegistry';
import {
    evaluateExternalInferencePolicy,
    type ExternalInferenceAuthorization,
} from '@/features/intelligence/services/externalInferencePolicy';
import type {
    InferenceFailure,
    InferenceRequest,
    InferenceResult,
    PredictionTask,
} from '@/features/intelligence/types/inference';
import type { Json } from '@/types/supabase';

export interface RunInferenceInput<TInput = Json> {
    userId?: string;
    task: PredictionTask;
    input: TInput;
    context?: Json;
    sensitive?: boolean;
    externalAuthorization?: ExternalInferenceAuthorization;
    requiredConsentScopes?: string[];
    cacheKey?: string;
}

export async function runInference<TInput = Json, TOutput = Json>(
    input: RunInferenceInput<TInput>,
): Promise<InferenceResult<TOutput>> {
    const request = buildRequest(input);
    const externalDenial = evaluateExternalInferencePolicy({
        sensitive: request.sensitive,
        requiredConsentScopes: request.requiredConsentScopes,
        ...(input.externalAuthorization
            ? { authorization: input.externalAuthorization }
            : {}),
    });
    const providers = getProvidersForTask(
        request.task,
        externalDenial === null,
    );
    if (providers.length === 0 && externalDenial) {
        return failure(request, externalDenial, false);
    }
    const log = getLogger({ operation: 'runInference', task: request.task });
    let lastFailure: InferenceFailure | null = null;
    for (const provider of providers) {
        try {
            const result = await retryProvider(
                () => provider.infer<TInput, TOutput>(request),
                request.retryPolicy,
            );
            log.info(
                { providerId: provider.id, status: result.status },
                'Inference completed',
            );
            if (result.status === 'abstained') return result;
            if (
                result.confidence.value >=
                    request.fallback.stopWhenConfidenceAtLeast ||
                provider.id === providers.at(-1)?.id
            ) {
                return result;
            }
        } catch (error) {
            const details = inferenceFailureDetails(error);
            lastFailure = failure(
                request,
                details.code,
                details.retryable,
                provider.id,
            );
            log.warn(
                { providerId: provider.id, code: details.code },
                'Inference provider failed',
            );
        }
    }
    return lastFailure ?? failure(request, 'provider_unavailable', true);
}

function buildRequest<TInput>(
    input: RunInferenceInput<TInput>,
): InferenceRequest<TInput> {
    return {
        id: randomUUID(),
        task: input.task,
        input: input.input,
        sensitive: input.sensitive ?? false,
        requiredConsentScopes: input.requiredConsentScopes ?? [],
        fallback: {
            providerIds: [
                'deterministic-rules',
                'internal-ml-service',
                'anthropic',
            ],
            stopWhenConfidenceAtLeast: 0.72,
            allowExternal: input.externalAuthorization?.allowExternal ?? false,
        },
        retryPolicy: { maxAttempts: 2, timeoutMs: 12_000, backoffMs: 250 },
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.context ? { context: input.context } : {}),
        ...(input.cacheKey ? { cacheKey: input.cacheKey } : {}),
    };
}

function failure<TInput>(
    request: InferenceRequest<TInput>,
    code: InferenceFailure['code'],
    retryable: boolean,
    providerId?: string,
): InferenceFailure {
    const timestamp = new Date().toISOString();
    return {
        status: 'failed',
        requestId: request.id,
        task: request.task,
        code,
        retryable,
        ...(providerId ? { providerId } : {}),
        audit: {
            requestId: request.id,
            providerId: providerId ?? 'policy',
            task: request.task,
            startedAt: timestamp,
            completedAt: timestamp,
            status: 'failed',
            failureCode: code,
            redactedInputHash: hashInferenceInput(request.input),
        },
    };
}

async function retryProvider<T>(
    operation: () => Promise<T>,
    policy: InferenceRequest['retryPolicy'],
) {
    let lastError: unknown;
    for (let attempt = 0; attempt < policy.maxAttempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            if (!inferenceFailureDetails(error).retryable) throw error;
            if (attempt + 1 < policy.maxAttempts) {
                await new Promise((resolve) =>
                    setTimeout(resolve, policy.backoffMs * (attempt + 1)),
                );
            }
        }
    }
    throw lastError;
}
