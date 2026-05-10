import { captureError } from './lib/observability/sentry';

export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('./sentry.server.config');

        const { getLogger } = await import('./lib/observability/logger');
        const log = getLogger({ operation: 'server.boot' });
        log.info(
            {
                nodeVersion: process.version,
                environment: process.env.NODE_ENV,
                sentryEnabled: Boolean(process.env.SENTRY_DSN),
            },
            'Server instrumentation registered',
        );
    } else if (process.env.NEXT_RUNTIME === 'edge') {
        await import('./sentry.edge.config');
    }
}

export const onRequestError = (
    err: unknown,
    request: { path: string; method: string },
    context: { routerKind: string; routePath: string },
) => {
    // Next.js 15+ hook: called for every unhandled error in a request.
    // Forward to Sentry so API route crashes are captured even if the route
    // doesn't explicitly handle them.

    captureError(err, {
        operation: `${request.method} ${request.path}`,
        tags: {
            routerKind: context.routerKind,
            routePath: context.routePath,
        },
    });
};
