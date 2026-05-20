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
    | 'research_synthesis';

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
    fallback: import('@/features/intelligence/types/policyTypes').FallbackStrategy;
    retryPolicy: import('@/features/intelligence/types/policyTypes').RetryPolicy;
    cacheKey?: string;
}

export interface InferenceResult<TOutput = Json> {
    requestId: string;
    providerId: string;
    task: PredictionTask;
    output: TOutput;
    confidence: ConfidenceScore;
    model: import('@/features/intelligence/types/modelTypes').ModelMetadata;
    cost?: import('@/features/intelligence/types/modelTypes').CostTracking;
    audit: import('@/features/intelligence/types/auditTypes').InferenceAudit;
}
