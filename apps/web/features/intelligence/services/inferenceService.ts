import { randomUUID } from 'crypto';
import type { Json } from '@/types/supabase';
import { getLogger } from '@/lib/observability/logger';
import { getProvidersForTask } from '@/features/intelligence/providers/providerRegistry';
import type {
    InferenceRequest,
    InferenceResult,
    PredictionTask,
} from '@/features/intelligence/types/inference';

export interface RunInferenceInput<TInput = Json> {
    userId?: string;
    task: PredictionTask;
    input: TInput;
    context?: Json;
    sensitive?: boolean;
    allowExternal?: boolean;
    requiredConsentScopes?: string[];
    cacheKey?: string;
}

export async function runInference<TInput = Json, TOutput = Json>(
    input: RunInferenceInput<TInput>,
): Promise<InferenceResult<TOutput>> {
    const request = buildRequest(input);
    const providers = getProvidersForTask(
        request.task,
        request.fallback.allowExternal,
    );
    const errors: string[] = [];
    const log = getLogger({
        operation: 'runInference',
        task: request.task,
        ...(request.userId ? { userId: request.userId } : {}),
    });

    for (const provider of providers) {
        try {
            const result = await retry(
                () => provider.infer<TInput, TOutput>(request),
                request.retryPolicy.maxAttempts,
            );
            log.info(
                {
                    providerId: provider.id,
                    confidence: result.confidence.value,
                },
                'Inference completed',
            );
            if (
                result.confidence.value >=
                    request.fallback.stopWhenConfidenceAtLeast ||
                provider.id === providers.at(-1)?.id
            ) {
                return result;
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Unknown inference error';
            errors.push(`${provider.id}: ${message}`);
            log.warn(
                { providerId: provider.id, error: message },
                'Inference provider failed',
            );
        }
    }

    throw new Error(`No inference provider succeeded: ${errors.join('; ')}`);
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
            providerIds: [],
            stopWhenConfidenceAtLeast: 0.72,
            allowExternal: input.allowExternal ?? false,
        },
        retryPolicy: { maxAttempts: 2, timeoutMs: 5000, backoffMs: 250 },
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.context ? { context: input.context } : {}),
        ...(input.cacheKey ? { cacheKey: input.cacheKey } : {}),
    };
}

async function retry<T>(operation: () => Promise<T>, attempts: number) {
    let lastError: unknown;
    for (let attempt = 0; attempt < attempts; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
        }
    }
    throw lastError;
}
