import type { InferenceFailure } from '@/features/intelligence/types/inference';

export class InferenceProviderError extends Error {
    constructor(
        public readonly code: InferenceFailure['code'],
        public readonly retryable: boolean,
    ) {
        super(code);
        this.name = 'InferenceProviderError';
    }
}

export function inferenceFailureDetails(error: unknown): {
    code: InferenceFailure['code'];
    retryable: boolean;
} {
    if (error instanceof InferenceProviderError) {
        return { code: error.code, retryable: error.retryable };
    }
    if (error instanceof DOMException && error.name === 'TimeoutError') {
        return { code: 'timeout', retryable: true };
    }
    return { code: 'provider_failed', retryable: true };
}
