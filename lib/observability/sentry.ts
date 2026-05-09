import * as Sentry from '@sentry/nextjs';

export interface ErrorContext {
    userId?: string;
    requestId?: string;
    operation?: string;
    feature?: string;
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
}

/** Capture an exception with structured context attached to the Sentry event. */
export function captureError(err: unknown, ctx: ErrorContext = {}): void {
    Sentry.withScope((scope) => {
        if (ctx.userId) scope.setUser({ id: ctx.userId });
        if (ctx.requestId) scope.setTag('requestId', ctx.requestId);
        if (ctx.operation) scope.setTag('operation', ctx.operation);
        if (ctx.feature) scope.setTag('feature', ctx.feature);
        if (ctx.tags) {
            for (const [k, v] of Object.entries(ctx.tags)) scope.setTag(k, v);
        }
        if (ctx.extra) scope.setExtras(ctx.extra);
        Sentry.captureException(err);
    });
}

export function captureMessage(
    message: string,
    level: Sentry.SeverityLevel,
    ctx: ErrorContext = {},
): void {
    Sentry.withScope((scope) => {
        if (ctx.userId) scope.setUser({ id: ctx.userId });
        if (ctx.requestId) scope.setTag('requestId', ctx.requestId);
        if (ctx.tags) {
            for (const [k, v] of Object.entries(ctx.tags)) scope.setTag(k, v);
        }
        Sentry.captureMessage(message, level);
    });
}
