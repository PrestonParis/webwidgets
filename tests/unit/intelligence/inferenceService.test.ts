import { afterEach, describe, expect, it, vi } from 'vitest';
import { runInference } from '@/features/intelligence/services/inferenceService';

const input = {
    items: [{ id: 'event-1', text: 'A bounded timeline update' }],
};

const authorization = {
    allowExternal: true,
    paidTier: true,
    grantedConsentScopes: [
        'external_llm',
        'external_sensitive_inference',
        'timeline_analysis',
    ],
};

describe('inference service outcomes', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('returns an explicit consent failure without calling a provider', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        const result = await runInference({
            task: 'summarization',
            input,
            sensitive: true,
        });

        expect(result).toMatchObject({
            status: 'failed',
            code: 'external_not_allowed',
            retryable: false,
        });
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns a typed provider failure after bounded retry', async () => {
        vi.stubEnv('INFERENCE_SERVICE_URL', 'https://ml.example.com');
        vi.stubEnv('ML_SERVICE_TOKEN', 'secret');
        vi.stubEnv('ALLOW_SHARED_LLM_KEYS', 'true');
        const fetchMock = vi
            .fn()
            .mockResolvedValue(new Response(null, { status: 503 }));
        vi.stubGlobal('fetch', fetchMock);

        const result = await runInference({
            task: 'summarization',
            input,
            sensitive: true,
            requiredConsentScopes: ['timeline_analysis'],
            externalAuthorization: authorization,
        });

        expect(result).toMatchObject({
            status: 'failed',
            providerId: 'anthropic',
            code: 'provider_unavailable',
            retryable: true,
        });
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
