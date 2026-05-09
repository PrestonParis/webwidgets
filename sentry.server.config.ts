import * as Sentry from '@sentry/nextjs';

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,

    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [Sentry.httpIntegration()],

    // Don't report expected business-logic errors
    beforeSend(event, hint) {
        const err = hint.originalException;
        if (err instanceof Error) {
            if (
                err.message.includes('invalid_grant') ||
                err.message.includes('Unauthorized')
            ) {
                return null;
            }
        }
        return event;
    },
});
