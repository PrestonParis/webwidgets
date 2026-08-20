import type { InferenceFailure } from '@/features/intelligence/types/inference';

export const EXTERNAL_LLM_CONSENT_SCOPE = 'external_llm';
export const SENSITIVE_LLM_CONSENT_SCOPE = 'external_sensitive_inference';

export interface ExternalInferenceAuthorization {
    allowExternal: boolean;
    paidTier: boolean;
    grantedConsentScopes: string[];
}

export function evaluateExternalInferencePolicy(input: {
    authorization?: ExternalInferenceAuthorization;
    sensitive: boolean;
    requiredConsentScopes: string[];
}): InferenceFailure['code'] | null {
    const authorization = input.authorization;
    if (!authorization?.allowExternal) return 'external_not_allowed';
    if (!authorization.paidTier) return 'paid_tier_required';
    const required = new Set([
        EXTERNAL_LLM_CONSENT_SCOPE,
        ...input.requiredConsentScopes,
        ...(input.sensitive ? [SENSITIVE_LLM_CONSENT_SCOPE] : []),
    ]);
    const granted = new Set(authorization.grantedConsentScopes);
    return [...required].every((scope) => granted.has(scope))
        ? null
        : 'consent_denied';
}
