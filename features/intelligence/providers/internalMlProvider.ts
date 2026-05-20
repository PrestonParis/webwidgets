import type { Json } from '@/types/supabase';
import { confidence } from '@/features/intelligence/lib/confidence';
import { hashInferenceInput } from '@/features/intelligence/lib/redaction';
import type {
    InferenceRequest,
    InferenceResult,
} from '@/features/intelligence/types/inferenceTypes';
import type { MLProvider } from '@/features/intelligence/types/providerTypes';

export function createInternalMlProvider(): MLProvider {
    return {
        id: 'internal-ml-service',
        kind: 'internal-ml',
        availability: process.env.ML_SERVICE_URL
            ? 'available'
            : 'missing_config',
        capabilities: {
            tasks: [
                'email_classification',
                'email_action_extraction',
                'widget_recommendation',
            ],
            supportsBatching: true,
            supportsOffline: false,
            supportsStreaming: false,
        },
        rateLimits: { requestsPerMinute: 120 },
        infer: inferWithInternalMl,
    };
}

async function inferWithInternalMl<TInput = Json, TOutput = Json>(
    request: InferenceRequest<TInput>,
): Promise<InferenceResult<TOutput>> {
    const mlUrl = process.env.ML_SERVICE_URL;
    if (!mlUrl) throw new Error('ML_SERVICE_URL is not configured');

    const endpoint = getEndpoint(request.task);
    const startedAt = new Date().toISOString();
    const response = await fetch(`${mlUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.input),
        signal: AbortSignal.timeout(request.retryPolicy.timeoutMs),
    });

    if (!response.ok)
        throw new Error(`Internal ML service returned ${response.status}`);

    const output = (await response.json()) as TOutput;
    const completedAt = new Date().toISOString();
    return {
        requestId: request.id,
        providerId: 'internal-ml-service',
        task: request.task,
        output,
        confidence: confidence(0.7),
        model: { modelId: request.task, providerId: 'internal-ml-service' },
        audit: {
            requestId: request.id,
            providerId: 'internal-ml-service',
            task: request.task,
            startedAt,
            completedAt,
            status: 'success',
            redactedInputHash: hashInferenceInput(request.input),
        },
    };
}

function getEndpoint(task: InferenceRequest['task']) {
    if (task === 'email_classification') return '/predict/batch';
    if (task === 'email_action_extraction') return '/extract-actions';
    if (task === 'widget_recommendation') return '/suggest-widgets';
    throw new Error(`Internal ML provider does not support ${task}`);
}
