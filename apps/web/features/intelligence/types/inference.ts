import type { Json } from '@/types/supabase';

export type PredictionTask =
    | 'email_classification'
    | 'email_action_extraction'
    | 'widget_recommendation'
    | 'onboarding_goal_classification'
    | 'activity_prioritization'
    | 'finance_categorization'
    | 'tracking_insight_scoring'
    | 'notification_ranking'
    | 'automation_recommendation'
    | 'anomaly_detection'
    | 'search_ranking'
    | 'personalization_scoring'
    | 'summarization'
    | 'research_synthesis'
    | 'commitment_candidates';

export interface ConfidenceScore {
    value: number;
    label: 'low' | 'medium' | 'high';
    threshold: number;
}

export interface InferenceRequest<TInput = Json> {
    id: string;
    userId?: string;
    task: PredictionTask;
    input: TInput;
    context?: Json;
    sensitive: boolean;
    requiredConsentScopes: string[];
    fallback: import('@/features/intelligence/types/policy').FallbackStrategy;
    retryPolicy: import('@/features/intelligence/types/policy').RetryPolicy;
    cacheKey?: string;
}

interface InferenceResultBase {
    requestId: string;
    providerId: string;
    task: PredictionTask;
    model: import('@/features/intelligence/types/model').ModelMetadata;
    cost?: import('@/features/intelligence/types/model').CostTracking;
    audit: import('@/features/intelligence/types/audit').InferenceAudit;
}

export interface InferenceSuccess<TOutput = Json> extends InferenceResultBase {
    status: 'success';
    output: TOutput;
    confidence: ConfidenceScore;
}

export interface InferenceAbstention extends InferenceResultBase {
    status: 'abstained';
    reason: 'insufficient_evidence' | 'unsafe_content' | 'model_abstained';
}

export interface InferenceFailure {
    status: 'failed';
    requestId: string;
    providerId?: string;
    task: PredictionTask;
    code:
        | 'consent_denied'
        | 'external_not_allowed'
        | 'paid_tier_required'
        | 'provider_unavailable'
        | 'rate_limited'
        | 'timeout'
        | 'malformed_output'
        | 'provider_failed';
    retryable: boolean;
    audit: import('@/features/intelligence/types/audit').InferenceAudit;
}

export type InferenceProviderResult<TOutput = Json> =
    | InferenceSuccess<TOutput>
    | InferenceAbstention;

export type InferenceResult<TOutput = Json> =
    | InferenceProviderResult<TOutput>
    | InferenceFailure;
