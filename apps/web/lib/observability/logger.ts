import pino, { type Logger } from 'pino';
import { AsyncLocalStorage } from 'async_hooks';

export interface LogContext {
    requestId?: string;
    userId?: string;
    operation?: string;
    [key: string]: unknown;
}

const contextStore = new AsyncLocalStorage<LogContext>();

const REDACT = {
    paths: [
        '*.password',
        '*.access_token',
        '*.refresh_token',
        '*.apiKey',
        '*.api_key',
    ] as string[],
    censor: '[REDACTED]',
};

// Two separate pino() calls so neither gets transport: undefined (exactOptionalPropertyTypes).
const base: Logger =
    process.env.NODE_ENV !== 'production'
        ? pino({
              level: process.env.LOG_LEVEL ?? 'debug',
              transport: {
                  target: 'pino-pretty',
                  options: { colorize: true, singleLine: false },
              },
              base: {
                  service: 'dashboard',
                  env: process.env.NODE_ENV ?? 'development',
                  release: process.env.npm_package_version ?? 'unknown',
              },
              timestamp: pino.stdTimeFunctions.isoTime,
              serializers: { err: pino.stdSerializers.err },
              redact: REDACT,
          })
        : pino({
              level: process.env.LOG_LEVEL ?? 'info',
              base: {
                  service: 'dashboard',
                  env: 'production',
                  release: process.env.npm_package_version ?? 'unknown',
              },
              timestamp: pino.stdTimeFunctions.isoTime,
              serializers: { err: pino.stdSerializers.err },
              redact: REDACT,
          });

/** Return a child logger pre-merged with the current AsyncLocalStorage context. */
export function getLogger(overrides?: LogContext): Logger {
    const ctx = contextStore.getStore() ?? {};
    return base.child({ ...ctx, ...overrides });
}

/** Run fn inside a log context (sets requestId, userId, etc. for all logs in the call chain). */
export function runWithContext<T>(ctx: LogContext, fn: () => T): T {
    return contextStore.run(ctx, fn);
}

/**
 * Wrap an async operation with structured timing + auto error logging.
 * Re-throws the original error after logging.
 */
export async function traced<T>(
    operation: string,
    fn: () => Promise<T>,
    extra?: LogContext,
): Promise<T> {
    const log = getLogger({ operation, ...extra });
    const start = performance.now();
    try {
        const result = await fn();
        log.info(
            { durationMs: Math.round(performance.now() - start) },
            operation,
        );
        return result;
    } catch (err) {
        log.error(
            { err, durationMs: Math.round(performance.now() - start) },
            `${operation} failed`,
        );
        throw err;
    }
}
