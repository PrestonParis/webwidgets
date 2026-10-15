import { z } from 'zod';
import { confidence } from '@/features/intelligence/lib/confidence';
import { hashInferenceInput } from '@/features/intelligence/lib/redaction';
import { InferenceProviderError } from '@/features/intelligence/providers/providerError';
import {
    commitmentCandidatesInputSchema,
    commitmentCandidatesOutputSchema,
    researchSynthesisInputSchema,
    researchSynthesisOutputSchema,
    summarizationInputSchema,
    summarizationOutputSchema,
} from '@/features/intelligence/types/externalInference';
import type {
    InferenceProviderResult,
    InferenceRequest,
} from '@/features/intelligence/types/inference';
import type { LLMProvider } from '@/features/intelligence/types/provider';
import type { Json } from '@/types/supabase';
import { sharedLlmKeysEnabled } from '@/lib/llm/sharedKeys';

const serviceResponseSchema = z.discriminatedUnion('status', [
    z.object({
        status: z.literal('success'),
        provider: z.literal('anthropic'),
        model: z.string().min(1),
        modelVersion: z.string().min(1),
        output: z.unknown(),
        confidence: z.number().min(0).max(1),
        inputTokens: z.number().int().nonnegative(),
        outputTokens: z.number().int().nonnegative(),
        estimatedCostUsd: z.number().nonnegative(),
        pricingConfigured: z.boolean(),
    }),
    z.object({
        status: z.literal('abstained'),
        provider: z.literal('anthropic'),
        model: z.string().min(1),
        modelVersion: z.string().min(1),
        reason: z.enum([
            'insufficient_evidence',
            'unsafe_content',
            'model_abstained',
        ]),
        inputTokens: z.number().int().nonnegative(),
        outputTokens: z.number().int().nonnegative(),
        estimatedCostUsd: z.number().nonnegative(),
        pricingConfigured: z.boolean(),
    }),
]);

export function createAnthropicProvider(): LLMProvider {
    const configured =
        sharedLlmKeysEnabled() &&
        Boolean(
            process.env.INFERENCE_SERVICE_URL && process.env.ML_SERVICE_TOKEN,
        );
    return {
        id: 'anthropic',
        kind: 'llm',
        availability: configured ? 'available' : 'missing_config',
        capabilities: {
            tasks: [
                'summarization',
                'research_synthesis',
                'commitment_candidates',
            ],
            supportsBatching: false,
            supportsOffline: false,
            supportsStreaming: false,
        },
        rateLimits: { requestsPerMinute: 20, tokensPerMinute: 80_000 },
        infer: inferWithAnthropic,
    };
}

async function inferWithAnthropic<TInput = Json, TOutput = Json>(
    request: InferenceRequest<TInput>,
): Promise<InferenceProviderResult<TOutput>> {
    const input = parseInput(request);
    const startedAt = new Date().toISOString();
    const response = await callInferenceService(request, input);
    const parsed = serviceResponseSchema.safeParse(response);
    if (!parsed.success) {
        throw new InferenceProviderError('malformed_output', false);
    }
    const common = resultMetadata(request, parsed.data, startedAt);
    if (parsed.data.status === 'abstained') {
        return {
            ...common,
            status: 'abstained',
            reason: parsed.data.reason,
            audit: { ...common.audit, status: 'abstained' },
        };
    }
    const output = parseOutput(request, parsed.data.output);
    return {
        ...common,
        status: 'success',
        output: output as TOutput,
        confidence: confidence(parsed.data.confidence),
    };
}

function parseInput<TInput>(request: InferenceRequest<TInput>) {
    const schema = inputSchemaFor(request.task);
    const parsed = schema.safeParse(request.input);
    if (!parsed.success)
        throw new InferenceProviderError('malformed_output', false);
    return parsed.data;
}

function parseOutput<TInput>(
    request: InferenceRequest<TInput>,
    output: unknown,
) {
    const schema = outputSchemaFor(request.task);
    const parsed = schema.safeParse(output);
    if (!parsed.success)
        throw new InferenceProviderError('malformed_output', false);
    return parsed.data;
}

function inputSchemaFor(task: InferenceRequest['task']) {
    if (task === 'summarization') return summarizationInputSchema;
    if (task === 'commitment_candidates')
        return commitmentCandidatesInputSchema;
    return researchSynthesisInputSchema;
}

function outputSchemaFor(task: InferenceRequest['task']) {
    if (task === 'summarization') return summarizationOutputSchema;
    if (task === 'commitment_candidates')
        return commitmentCandidatesOutputSchema;
    return researchSynthesisOutputSchema;
}

async function callInferenceService<TInput>(
    request: InferenceRequest<TInput>,
    input: Json,
) {
    const baseUrl = process.env.INFERENCE_SERVICE_URL;
    const token = process.env.ML_SERVICE_TOKEN;
    if (!sharedLlmKeysEnabled() || !baseUrl || !token)
        throw new InferenceProviderError('provider_unavailable', true);
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/v1/inference`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Request-ID': request.id,
        },
        body: JSON.stringify({
            requestId: request.id,
            task: request.task,
            input,
        }),
        signal: AbortSignal.timeout(request.retryPolicy.timeoutMs),
    });
    if (response.status === 429)
        throw new InferenceProviderError('rate_limited', true);
    if (response.status === 503)
        throw new InferenceProviderError('provider_unavailable', true);
    if (!response.ok)
        throw new InferenceProviderError(
            'provider_failed',
            response.status >= 500,
        );
    return response.json() as Promise<unknown>;
}

function resultMetadata<TInput>(
    request: InferenceRequest<TInput>,
    response: z.infer<typeof serviceResponseSchema>,
    startedAt: string,
) {
    return {
        requestId: request.id,
        providerId: response.provider,
        task: request.task,
        model: {
            modelId: response.model,
            version: response.modelVersion,
            providerId: response.provider,
        },
        cost: {
            unit: 'token' as const,
            inputTokens: response.inputTokens,
            outputTokens: response.outputTokens,
            estimatedCostUsd: response.estimatedCostUsd,
            pricingConfigured: response.pricingConfigured,
        },
        audit: {
            requestId: request.id,
            providerId: response.provider,
            task: request.task,
            startedAt,
            completedAt: new Date().toISOString(),
            status: 'success' as const,
            redactedInputHash: hashInferenceInput(request.input),
        },
    };
}
