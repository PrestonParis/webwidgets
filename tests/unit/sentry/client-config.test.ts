import { vi, describe, it, expect, beforeAll } from 'vitest';
import type * as SentryType from '@sentry/nextjs';
import type { Breadcrumb } from '@sentry/nextjs';

type SentryEvent = Parameters<
    NonNullable<Parameters<typeof SentryType.init>[0]>['beforeSend']
>[0];

type InitOptions = Parameters<typeof SentryType.init>[0] & {
    beforeSend: (event: SentryEvent) => SentryEvent | null;
};

const store = vi.hoisted(() => ({ opts: null as InitOptions | null }));

vi.mock('@sentry/nextjs', () => ({
    init: (opts: InitOptions) => {
        store.opts = opts;
    },
}));

beforeAll(async () => {
    await import('@/sentry.client.config');
});

function makeEvent(breadcrumbs: Breadcrumb[]): SentryEvent {
    return { breadcrumbs } as SentryEvent;
}

describe('sentry client config — breadcrumb sanitization', () => {
    it('redacts access_token', () => {
        const event = makeEvent([
            { data: { access_token: 'secret', safe: 'value' } },
        ]);
        const result = store.opts?.beforeSend(event);
        expect(
            (result?.breadcrumbs as Breadcrumb[])[0].data?.access_token,
        ).toBe('[REDACTED]');
        expect((result?.breadcrumbs as Breadcrumb[])[0].data?.safe).toBe(
            'value',
        );
    });

    it('redacts refresh_token', () => {
        const event = makeEvent([{ data: { refresh_token: 'tok' } }]);
        const result = store.opts?.beforeSend(event);
        expect(
            (result?.breadcrumbs as Breadcrumb[])[0].data?.refresh_token,
        ).toBe('[REDACTED]');
    });

    it('redacts password', () => {
        const event = makeEvent([{ data: { password: 'hunter2' } }]);
        const result = store.opts?.beforeSend(event);
        expect((result?.breadcrumbs as Breadcrumb[])[0].data?.password).toBe(
            '[REDACTED]',
        );
    });

    it('redacts api_key and apiKey', () => {
        const event = makeEvent([
            { data: { api_key: 'k1', apiKey: 'k2', url: '/ok' } },
        ]);
        const result = store.opts?.beforeSend(event);
        const data = (result?.breadcrumbs as Breadcrumb[])[0].data!;
        expect(data.api_key).toBe('[REDACTED]');
        expect(data.apiKey).toBe('[REDACTED]');
        expect(data.url).toBe('/ok');
    });

    it('passes through breadcrumbs with no sensitive keys', () => {
        const event = makeEvent([
            { data: { url: '/api/health', method: 'GET' } },
        ]);
        const result = store.opts?.beforeSend(event);
        const data = (result?.breadcrumbs as Breadcrumb[])[0].data!;
        expect(data.url).toBe('/api/health');
        expect(data.method).toBe('GET');
    });

    it('handles breadcrumbs with no data', () => {
        const event = makeEvent([{ category: 'navigation' }]);
        const result = store.opts?.beforeSend(event);
        expect((result?.breadcrumbs as Breadcrumb[])[0].data).toBeUndefined();
    });

    it('sanitizes all breadcrumbs in the event', () => {
        const event = makeEvent([
            { data: { access_token: 'a' } },
            { data: { url: '/safe' } },
            { data: { password: 'p', method: 'POST' } },
        ]);
        const result = store.opts?.beforeSend(event);
        const crumbs = result?.breadcrumbs as Breadcrumb[];
        expect(crumbs[0].data?.access_token).toBe('[REDACTED]');
        expect(crumbs[1].data?.url).toBe('/safe');
        expect(crumbs[2].data?.password).toBe('[REDACTED]');
        expect(crumbs[2].data?.method).toBe('POST');
    });

    it('returns event unchanged when breadcrumbs is not an array', () => {
        const event = { message: 'no breadcrumbs' } as SentryEvent;
        const result = store.opts?.beforeSend(event);
        expect(result).toBe(event);
    });
});
