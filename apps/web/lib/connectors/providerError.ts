export type ProviderErrorCode =
    | 'PROVIDER_NOT_CONFIGURED'
    | 'PROVIDER_UNAUTHORIZED'
    | 'PROVIDER_RATE_LIMITED'
    | 'PROVIDER_BAD_RESPONSE'
    | 'PROVIDER_TIMEOUT'
    | 'PROVIDER_UNAVAILABLE';

export class ProviderError extends Error {
    readonly code: ProviderErrorCode;

    constructor(code: ProviderErrorCode, message: string) {
        super(message);
        this.code = code;
        this.name = 'ProviderError';
    }
}

export function isProviderError(err: unknown): err is ProviderError {
    return err instanceof ProviderError;
}

export function isNotConfigured(err: unknown): boolean {
    return isProviderError(err) && err.code === 'PROVIDER_NOT_CONFIGURED';
}
