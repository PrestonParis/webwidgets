type CaptureRequestError = typeof import('@sentry/nextjs').captureRequestError;

const sentryDisabled = process.env.NEXT_DISABLE_SENTRY === '1';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        if (!sentryDisabled) {
            await import('./sentry.server.config');
        }

        const shutdown = (signal: string) => {
            console.log(`Received ${signal}, shutting down...`);
            process.exit(0);
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } else if (process.env.NEXT_RUNTIME === 'edge' && !sentryDisabled) {
        await import('./sentry.edge.config');
    }
}

export const onRequestError: CaptureRequestError = async (...args) => {
    if (sentryDisabled) return;

    const Sentry = await import('@sentry/nextjs');
    return Sentry.captureRequestError(...args);
};
