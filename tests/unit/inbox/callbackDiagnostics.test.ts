import { describe, expect, it } from 'vitest';
import { safeCallbackFailure } from '@/app/api/auth/_lib/callbackDiagnostics';

describe('safe OAuth failure diagnostics', () => {
    it.each([
        'google_audience_mismatch',
        'provider_credential_persistence_failed',
        'session_sanitization_failed',
    ])('reports the known category %s', (reason) => {
        expect(safeCallbackFailure(new Error(reason))).toBe(reason);
    });

    it.each([
        new Error('https://provider.invalid/?access_token=PRIVATE-TOKEN'),
        { code: 'PRIVATE-TOKEN', message: 'PRIVATE-CODE' },
        'PRIVATE-SECRET',
        null,
    ])('does not serialize unknown errors', (error) => {
        expect(safeCallbackFailure(error)).toBe(
            'unclassified_callback_failure',
        );
    });
});
