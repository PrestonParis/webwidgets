export interface JobRetryPolicy {
    maxRetries: number;
    retryCount: number;
}

export function canRetry(policy: JobRetryPolicy) {
    return policy.retryCount < policy.maxRetries;
}
