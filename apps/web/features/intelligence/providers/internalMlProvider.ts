import type { Json } from '@/types/supabase';
import { confidence } from '@/features/intelligence/lib/confidence';
import { hashInferenceInput } from '@/features/intelligence/lib/redaction';
import type {
    InferenceRequest,
    InferenceProviderResult,
} from '@/features/intelligence/types/inference';
import type { MLProvider } from '@/features/intelligence/types/provider';

export function createInternalMlProvider(): MLProvider {
    return {
        id: 'internal-ml-service',
        kind: 'internal-ml',
        availability: process.env.ML_SERVICE_URL
            ? 'available'
            : 'missing_config',
        capabilities: {
            tasks: ['email_classification', 'widget_recommendation'],
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
): Promise<InferenceProviderResult<TOutput>> {
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
    const measuredConfidence = getMeasuredConfidence(request.task, output);
    const completedAt = new Date().toISOString();
    if (measuredConfidence === null || measuredConfidence <= 0) {
        return {
            status: 'abstained',
            requestId: request.id,
            providerId: 'internal-ml-service',
            task: request.task,
            reason: 'insufficient_evidence',
            model: {
                modelId: request.task,
                version: 'unavailable-model-fallback',
                providerId: 'internal-ml-service',
            },
            audit: {
                requestId: request.id,
                providerId: 'internal-ml-service',
                task: request.task,
                startedAt,
                completedAt,
                status: 'abstained',
                redactedInputHash: hashInferenceInput(request.input),
            },
        };
    }
    return {
        status: 'success',
        requestId: request.id,
        providerId: 'internal-ml-service',
        task: request.task,
        output,
        confidence: confidence(measuredConfidence),
        model: {
            modelId: request.task,
            version: 'measured-confidence',
            providerId: 'internal-ml-service',
        },
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
    if (task === 'widget_recommendation') return '/suggest';
    throw new Error(`Internal ML provider does not support ${task}`);
}

function getMeasuredConfidence(
    task: InferenceRequest['task'],
    output: unknown,
) {
    if (task === 'email_classification' && Array.isArray(output)) {
        const scores = output
            .map((item) => readConfidence(item))
            .filter((value): value is number => value !== null);
        return scores.length > 0 ? Math.min(...scores) : null;
    }
    if (task === 'widget_recommendation' && isRecord(output)) {
        const suggestions = output.suggestions;
        if (!Array.isArray(suggestions) || suggestions.length === 0) return 0;
        const scores = suggestions.map(readConfidence).filter(isNumber);
        return scores.length > 0 ? Math.max(...scores) : null;
    }
    return null;
}

function readConfidence(value: unknown) {
    if (!isRecord(value)) return null;
    return isNumber(value.confidence) ? value.confidence : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object';
}

function isNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}
