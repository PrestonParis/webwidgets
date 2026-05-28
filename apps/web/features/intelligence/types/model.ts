export interface ModelMetadata {
    modelId: string;
    version?: string;
    providerId: string;
    trainedAt?: string;
    description?: string;
}

export interface CostTracking {
    unit: 'request' | 'token' | 'second';
    estimatedCostUsd: number;
}
