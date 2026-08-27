import type { SupabaseClient } from '@supabase/supabase-js';
import type { InferenceResult } from '@/features/intelligence/types/inference';
import type { Database } from '@/types/supabase';

export async function persistInferenceRecord(
    db: SupabaseClient<Database>,
    userId: string,
    result: InferenceResult,
) {
    const metadata = {
        requestId: result.requestId,
        task: result.task,
        status: result.status,
        providerId: 'providerId' in result ? (result.providerId ?? null) : null,
        inputHash: result.audit.redactedInputHash ?? null,
        failureCode: result.audit.failureCode ?? null,
        modelId: 'model' in result ? result.model.modelId : null,
        modelVersion: 'model' in result ? (result.model.version ?? null) : null,
    };
    const writes: PromiseLike<unknown>[] = [
        db.from('analytics_events').insert({
            user_id: userId,
            type: 'bounded_inference',
            source: 'intelligence',
            metadata,
        }),
    ];
    if ('cost' in result && result.cost) {
        writes.push(
            db.from('cost_events').insert({
                user_id: userId,
                provider: result.providerId,
                feature: result.task,
                units:
                    (result.cost.inputTokens ?? 0) +
                    (result.cost.outputTokens ?? 0),
                cost_usd: result.cost.estimatedCostUsd,
                metadata: {
                    requestId: result.requestId,
                    modelId: result.model.modelId,
                    modelVersion: result.model.version ?? null,
                    inputTokens: result.cost.inputTokens ?? 0,
                    outputTokens: result.cost.outputTokens ?? 0,
                    pricingConfigured: result.cost.pricingConfigured ?? false,
                },
            }),
        );
    }
    const records = await Promise.all(writes);
    if (records.some(hasPersistenceError))
        throw new Error('Inference audit persistence failed');
}

function hasPersistenceError(value: unknown) {
    if (!value || typeof value !== 'object' || !('error' in value))
        return false;
    return Boolean(value.error);
}
