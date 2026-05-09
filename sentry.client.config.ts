import * as Sentry from '@sentry/nextjs';
import type { Breadcrumb } from '@sentry/nextjs';

const SENSITIVE_KEYS = new Set([
    'access_token',
    'refresh_token',
    'password',
    'api_key',
    'apiKey',
]);

function sanitizeBreadcrumb(b: Breadcrumb): Breadcrumb {
    if (!b.data) return b;
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(b.data as Record<string, unknown>)) {
        sanitized[k] = SENSITIVE_KEYS.has(k) ? '[REDACTED]' : v;
    }
    return { ...b, data: sanitized };
}

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,

    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    ignoreErrors: [
        'AbortError',
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',
        /^Network request failed/,
        /^Failed to fetch/,
    ],

    beforeSend(event) {
        if (Array.isArray(event.breadcrumbs)) {
            event.breadcrumbs = (event.breadcrumbs as Breadcrumb[]).map(
                sanitizeBreadcrumb,
            );
        }
        return event;
    },
});
