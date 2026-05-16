import { vi, describe, it, expect, beforeAll } from 'vitest';
import type * as SentryType from '@sentry/nextjs';

type InitOptions = Parameters<typeof SentryType.init>[0] & {
    beforeSend: NonNullable<
        Parameters<typeof SentryType.init>[0]
    >['beforeSend'];
};

const store = vi.hoisted(() => ({ opts: null as InitOptions | null }));

vi.mock('@sentry/nextjs', () => ({
    init: (opts: InitOptions) => {
        store.opts = opts;
    },
    httpIntegration: () => ({}),
}));

beforeAll(async () => {
    await import('@/sentry.server.config');
});

describe('sentry server config — beforeSend filter', () => {
    it('drops errors containing invalid_grant', () => {
        const err = new Error('Token exchange failed: invalid_grant');
        const result = store.opts?.beforeSend?.({ type: 'event' } as never, {
            originalException: err,
        });
        expect(result).toBeNull();
    });

    it('drops errors containing Unauthorized', () => {
        const err = new Error('Unauthorized');
        const result = store.opts?.beforeSend?.({ type: 'event' } as never, {
            originalException: err,
        });
        expect(result).toBeNull();
    });

    it('passes through unrelated errors', () => {
        const err = new Error('Something went wrong');
        const event = { type: 'event', message: 'Something went wrong' };
        const result = store.opts?.beforeSend?.(event as never, {
            originalException: err,
        });
        expect(result).toBe(event);
    });

    it('passes through non-Error exceptions', () => {
        const event = { type: 'event' };
        const result = store.opts?.beforeSend?.(event as never, {
            originalException: 'string error',
        });
        expect(result).toBe(event);
    });

    it('passes through events with no exception', () => {
        const event = { type: 'event' };
        const result = store.opts?.beforeSend?.(event as never, {});
        expect(result).toBe(event);
    });
});
