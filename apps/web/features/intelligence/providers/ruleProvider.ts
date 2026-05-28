import type { Json } from '@/types/supabase';
import { confidence } from '@/features/intelligence/lib/confidence';
import { hashInferenceInput } from '@/features/intelligence/lib/redaction';
import type {
    InferenceRequest,
    InferenceResult,
} from '@/features/intelligence/types/inference';
import type { MLProvider } from '@/features/intelligence/types/provider';

export function createRuleProvider(): MLProvider {
    return {
        id: 'deterministic-rules',
        kind: 'rules',
        availability: 'available',
        capabilities: {
            tasks: [
                'widget_recommendation',
                'activity_prioritization',
                'automation_recommendation',
                'notification_ranking',
            ],
            supportsBatching: true,
            supportsOffline: true,
            supportsStreaming: false,
        },
        infer: inferWithRules,
    };
}

function inferWithRules<TInput = Json, TOutput = Json>(
    request: InferenceRequest<TInput>,
): Promise<InferenceResult<TOutput>> {
    const startedAt = new Date().toISOString();
    const output = {
        provider: 'deterministic-rules',
        task: request.task,
        recommendations: [],
    } as TOutput;
    return Promise.resolve({
        requestId: request.id,
        providerId: 'deterministic-rules',
        task: request.task,
        output,
        confidence: confidence(0.55),
        model: {
            modelId: 'rules-v1',
            providerId: 'deterministic-rules',
            version: '1',
        },
        audit: {
            requestId: request.id,
            providerId: 'deterministic-rules',
            task: request.task,
            startedAt,
            completedAt: new Date().toISOString(),
            status: 'success',
            redactedInputHash: hashInferenceInput(request.input),
        },
    });
}
