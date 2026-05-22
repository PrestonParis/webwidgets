import type {
    InferenceRequest,
    InferenceResult,
    PredictionTask,
} from '@/features/intelligence/types/inferenceTypes';

export type IntelligenceProviderKind =
    | 'rules'
    | 'internal-ml'
    | 'embedding'
    | 'llm'
    | 'local';
export type ProviderAvailability =
    | 'available'
    | 'disabled'
    | 'missing_config'
    | 'beta'
    | 'unavailable';

export interface ProviderCapabilities {
    tasks: PredictionTask[];
    supportsBatching: boolean;
    supportsOffline: boolean;
    supportsStreaming: boolean;
}

export interface RateLimits {
    requestsPerMinute?: number;
    tokensPerMinute?: number;
}

export interface MLProvider {
    id: string;
    kind: IntelligenceProviderKind;
    availability: ProviderAvailability;
    capabilities: ProviderCapabilities;
    rateLimits?: RateLimits;
    infer: <
        TInput = import('@/types/supabase').Json,
        TOutput = import('@/types/supabase').Json,
    >(
        request: InferenceRequest<TInput>,
    ) => Promise<InferenceResult<TOutput>>;
}

export type LLMProvider = MLProvider & { kind: 'llm' };
export type EmbeddingProvider = MLProvider & { kind: 'embedding' };
