const PUBLIC_AUTH_PATHS = new Set([
    '/',
    '/auth/callback',
    '/auth/auth-code-error',
    '/reset-password',
]);

export function isPublicAuthPath(pathname: string): boolean {
    return PUBLIC_AUTH_PATHS.has(pathname);
}

export function getSignInRedirectPath(
    pathname: string,
    search: string,
): string {
    const params = new URLSearchParams();
    params.set('next', `${pathname}${search}`);
    return `/?${params.toString()}`;
}
