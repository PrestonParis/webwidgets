import { describe, expect, it } from 'vitest';
import {
    matchingOAuthState,
    newOAuthSecret,
    normalizeGrantedScopes,
    oauthDigest,
    pkceChallenge,
    safeOAuthRedirect,
} from '@/lib/auth/oauthConnectionPolicy';

describe('OAuth connection policy', () => {
    it.each([
        'https://evil.invalid',
        '//evil.invalid',
        '/\\evil.invalid',
        '/\ninvalid',
        '',
    ])('rejects unsafe redirect %j', (value) => {
        expect(safeOAuthRedirect(value)).toBe('/inbox');
    });
    it('preserves an internal redirect and query', () => {
        expect(safeOAuthRedirect('/inbox?account=one')).toBe(
            '/inbox?account=one',
        );
    });
    it('requires a matching high-entropy state cookie', () => {
        const state = newOAuthSecret();
        expect(matchingOAuthState(state, state)).toBe(true);
        expect(matchingOAuthState(state, newOAuthSecret())).toBe(false);
        expect(matchingOAuthState(state, undefined)).toBe(false);
        expect(matchingOAuthState('short', 'short')).toBe(false);
        expect(matchingOAuthState(state, state + 'x')).toBe(false);
    });
    it('hashes state and uses the RFC 7636 S256 challenge', () => {
        expect(oauthDigest('test')).toHaveLength(64);
        expect(
            pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk'),
        ).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
    });
    it('records only granted scopes without inventing write permissions', () => {
        expect(
            normalizeGrantedScopes(
                'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/calendar.events',
            ),
        ).toEqual(['calendar.events', 'gmail.readonly']);
        expect(
            normalizeGrantedScopes(
                'https://graph.microsoft.com/Mail.Read Mail.Read',
            ),
        ).toEqual(['Mail.Read']);
    });
});
