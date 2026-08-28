const SAFE_REASONS = new Set([
    'oauth_code_missing',
    'oauth_code_exchange_failed',
    'pkce_code_verifier_not_found',
    'bad_code_verifier',
    'flow_state_expired',
    'flow_state_not_found',
    'invalid_credentials',
    'google_identity_verification_failed',
    'google_email_unverified',
    'google_audience_mismatch',
    'google_mail_scope_missing',
    'google_token_missing',
    'provider_credential_persistence_failed',
    'session_sanitization_failed',
]);

export function safeCallbackFailure(error: unknown): string {
    if (typeof error === 'object' && error !== null && 'code' in error) {
        const code = error.code;
        if (typeof code === 'string' && SAFE_REASONS.has(code)) return code;
    }
    if (error instanceof Error && SAFE_REASONS.has(error.message))
        return error.message;
    return 'unclassified_callback_failure';
}
