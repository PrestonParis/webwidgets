import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    // Edge runtime is only used for middleware — minimal tracing needed
    tracesSampleRate: 0,
});
