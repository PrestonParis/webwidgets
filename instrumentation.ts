import './sentry.server.config';
import './sentry.edge.config';

import { getLogger } from './lib/observability/logger';
import { captureError } from './lib/observability/sentry';

export function register() {
    // Runs once when the Next.js server boots. Use this file to initialize
    // any server-side singletons that need to be set up before request handling.

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        const log = getLogger({ operation: 'server.boot' });

        log.info(
            {
                nodeVersion: process.version,
                environment: process.env.NODE_ENV,
                sentryEnabled: Boolean(process.env.SENTRY_DSN),
            },
            'Server instrumentation registered',
        );
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
