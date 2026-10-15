import { describe, expect, it } from 'vitest';
import { evaluateExternalInferencePolicy } from '@/features/intelligence/services/externalInferencePolicy';

const authorized = {
    allowExternal: true,
    paidTier: true,
    grantedConsentScopes: [
        'external_llm',
        'external_sensitive_inference',
        'timeline_analysis',
    ],
};

describe('external inference policy', () => {
    it('permits a paid, explicitly consented bounded request', () => {
        expect(
            evaluateExternalInferencePolicy({
                authorization: authorized,
                sensitive: true,
                requiredConsentScopes: ['timeline_analysis'],
            }),
        ).toBeNull();
    });

    it.each([
        [undefined, 'external_not_allowed'],
        [{ ...authorized, allowExternal: false }, 'external_not_allowed'],
        [{ ...authorized, paidTier: false }, 'paid_tier_required'],
        [{ ...authorized, grantedConsentScopes: [] }, 'consent_denied'],
    ])('rejects unauthorized policy state', (authorization, expected) => {
        expect(
            evaluateExternalInferencePolicy({
                ...(authorization && { authorization }),
                sensitive: true,
                requiredConsentScopes: ['timeline_analysis'],
            }),
        ).toBe(expected);
    });
});
