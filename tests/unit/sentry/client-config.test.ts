import { vi, describe, it, expect, beforeAll } from 'vitest';
import type * as SentryType from '@sentry/nextjs';
import type { Breadcrumb } from '@sentry/nextjs';

type SentryEvent = Parameters<
    NonNullable<
        NonNullable<Parameters<typeof SentryType.init>[0]>['beforeSend']
    >
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

function send(event: SentryEvent): SentryEvent | null {
    if (!store.opts) throw new Error('Sentry init was not called');
    return store.opts.beforeSend(event);
}

function breadcrumbsOf(event: SentryEvent | null): Breadcrumb[] {
    if (!event || !Array.isArray(event.breadcrumbs)) {
        throw new Error('Expected breadcrumbs array');
    }
    return event.breadcrumbs;
}

function breadcrumbAt(breadcrumbs: Breadcrumb[], index: number): Breadcrumb {
    const breadcrumb = breadcrumbs[index];
    if (!breadcrumb) throw new Error(`Expected breadcrumb at index ${index}`);
    return breadcrumb;
}

describe('sentry client config — breadcrumb sanitization', () => {
    it('redacts access_token', () => {
        const event = makeEvent([
            { data: { access_token: 'secret', safe: 'value' } },
        ]);
        const breadcrumb = breadcrumbAt(breadcrumbsOf(send(event)), 0);
        expect(breadcrumb.data?.access_token).toBe('[REDACTED]');
        expect(breadcrumb.data?.safe).toBe('value');
    });

    it('redacts refresh_token', () => {
        const event = makeEvent([{ data: { refresh_token: 'tok' } }]);
        const breadcrumb = breadcrumbAt(breadcrumbsOf(send(event)), 0);
        expect(breadcrumb.data?.refresh_token).toBe('[REDACTED]');
    });

    it('redacts password', () => {
        const event = makeEvent([{ data: { password: 'hunter2' } }]);
        const breadcrumb = breadcrumbAt(breadcrumbsOf(send(event)), 0);
        expect(breadcrumb.data?.password).toBe('[REDACTED]');
    });

    it('redacts api_key and apiKey', () => {
        const event = makeEvent([
            { data: { api_key: 'k1', apiKey: 'k2', url: '/ok' } },
        ]);
        const data = breadcrumbAt(breadcrumbsOf(send(event)), 0).data!;
        expect(data.api_key).toBe('[REDACTED]');
        expect(data.apiKey).toBe('[REDACTED]');
        expect(data.url).toBe('/ok');
    });

    it('passes through breadcrumbs with no sensitive keys', () => {
        const event = makeEvent([
            { data: { url: '/api/health', method: 'GET' } },
        ]);
        const data = breadcrumbAt(breadcrumbsOf(send(event)), 0).data!;
        expect(data.url).toBe('/api/health');
        expect(data.method).toBe('GET');
    });

    it('handles breadcrumbs with no data', () => {
        const event = makeEvent([{ category: 'navigation' }]);
        const breadcrumb = breadcrumbAt(breadcrumbsOf(send(event)), 0);
        expect(breadcrumb.data).toBeUndefined();
    });

    it('sanitizes all breadcrumbs in the event', () => {
        const event = makeEvent([
            { data: { access_token: 'a' } },
            { data: { url: '/safe' } },
            { data: { password: 'p', method: 'POST' } },
        ]);
        const crumbs = breadcrumbsOf(send(event));
        expect(breadcrumbAt(crumbs, 0).data?.access_token).toBe('[REDACTED]');
        expect(breadcrumbAt(crumbs, 1).data?.url).toBe('/safe');
        expect(breadcrumbAt(crumbs, 2).data?.password).toBe('[REDACTED]');
        expect(breadcrumbAt(crumbs, 2).data?.method).toBe('POST');
    });

    it('returns event unchanged when breadcrumbs is not an array', () => {
        const event = { message: 'no breadcrumbs' } as SentryEvent;
        const result = send(event);
        expect(result).toBe(event);
    });
});
