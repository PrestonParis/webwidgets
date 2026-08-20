import { afterEach, describe, expect, it, vi } from 'vitest';
import { createInternalMlProvider } from '@/features/intelligence/providers/internalMlProvider';
import type { InferenceRequest } from '@/features/intelligence/types/inference';

function request(
    task: 'email_classification' | 'widget_recommendation',
): InferenceRequest<Record<string, unknown>> {
    return {
        id: 'request-1',
        task,
        input:
            task === 'email_classification'
                ? { emails: [] }
                : { query: 'tasks' },
        sensitive: false,
        requiredConsentScopes: [],
        fallback: {
            providerIds: ['internal-ml-service'],
            stopWhenConfidenceAtLeast: 0.72,
            allowExternal: false,
        },
        retryPolicy: { maxAttempts: 1, timeoutMs: 1_000, backoffMs: 1 },
    };
}

describe('internal ML provider', () => {
    afterEach(() => vi.unstubAllGlobals());

    it('uses confidence returned by the loaded model', async () => {
        vi.stubEnv('ML_SERVICE_URL', 'https://ml.example.com');
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue(
                Response.json([
                    { id: '1', category: 'work', confidence: 0.83 },
                    { id: '2', category: 'other', confidence: 0.76 },
                ]),
            ),
        );

        const result = await createInternalMlProvider().infer(
            request('email_classification'),
        );

        expect(result.status).toBe('success');
        if (result.status === 'success') {
            expect(result.confidence.value).toBe(0.76);
        }
    });

    it('abstains when the endpoint returns its neutral no-model fallback', async () => {
        vi.stubEnv('ML_SERVICE_URL', 'https://ml.example.com');
        vi.stubGlobal(
            'fetch',
            vi
                .fn()
                .mockResolvedValue(
                    Response.json({ suggestions: [], suggest_ai: true }),
                ),
        );

        const result = await createInternalMlProvider().infer(
            request('widget_recommendation'),
        );

        expect(result.status).toBe('abstained');
        expect(result.model.version).toBe('unavailable-model-fallback');
    });
});
