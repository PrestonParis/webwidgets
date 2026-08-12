import { describe, expect, it } from 'vitest';
import {
    getSignInRedirectPath,
    isPublicAuthPath,
} from '@/features/auth/server/routeProtection';

describe('page route protection', () => {
    it.each([
        '/',
        '/auth/callback',
        '/auth/auth-code-error',
        '/reset-password',
    ])('keeps required auth route %s public', (pathname) => {
        expect(isPublicAuthPath(pathname)).toBe(true);
    });

    it.each([
        '/recovery',
        '/privacy',
        '/terms',
        '/files',
        '/admin',
        '/collaboration/invite/token',
        '/accessibility',
    ])('protects application route %s', (pathname) => {
        expect(isPublicAuthPath(pathname)).toBe(false);
    });

    it('preserves the requested path and query in the sign-in redirect', () => {
        expect(getSignInRedirectPath('/recovery', '?view=calendar')).toBe(
            '/?next=%2Frecovery%3Fview%3Dcalendar',
        );
    });
});
