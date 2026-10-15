import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export function safeOAuthRedirect(value: string | null, fallback = '/inbox') {
    if (
        !value ||
        !value.startsWith('/') ||
        value.startsWith('//') ||
        /[\\\x00-\x1f]/u.test(value)
    ) {
        return fallback;
    }
    return value;
}

export function newOAuthSecret() {
    return randomBytes(32).toString('base64url');
}

export function oauthDigest(value: string) {
    return createHash('sha256').update(value).digest('hex');
}

export function pkceChallenge(value: string) {
    return createHash('sha256').update(value).digest('base64url');
}

export function matchingOAuthState(
    state: string | null,
    cookie: string | undefined,
) {
    if (!state || !cookie || !/^[A-Za-z0-9_-]{43}$/u.test(state)) return false;
    const a = Buffer.from(state);
    const b = Buffer.from(cookie);
    return a.length === b.length && timingSafeEqual(a, b);
}

export function normalizeGrantedScopes(scope: string) {
    return [
        ...new Set(
            scope
                .split(/\s+/u)
                .filter(Boolean)
                .map((value) =>
                    value
                        .replace('https://www.googleapis.com/auth/', '')
                        .replace('https://graph.microsoft.com/', ''),
                ),
        ),
    ].sort();
}
