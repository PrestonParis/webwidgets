export interface RetryPolicy {
    maxAttempts: number;
    timeoutMs: number;
    backoffMs: number;
}

export interface FallbackStrategy {
    providerIds: string[];
    stopWhenConfidenceAtLeast: number;
    allowExternal: boolean;
}
