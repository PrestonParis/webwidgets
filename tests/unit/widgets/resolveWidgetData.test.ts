import { describe, expect, it, vi, beforeEach } from 'vitest';
import { z } from 'zod';
import type { DataResolver } from '@/features/widgets/types/snapshot';

const resolverMap = new Map<string, DataResolver>();

vi.mock('@/features/widgets/registry/widgetDataRegistry', () => ({
    getDataResolver: (key: string) => resolverMap.get(key),
}));

vi.mock('@/lib/observability/sentry', () => ({
    captureError: vi.fn(),
}));

describe('resolveWidgetData', () => {
    beforeEach(() => {
        resolverMap.clear();
    });

    it('resolves and validates data needs', async () => {
        resolverMap.set('demo.value', {
            key: 'demo.value',
            schema: z.object({ count: z.number() }),
            resolve: () => Promise.resolve({ count: 3 }),
        });
        const { resolveWidgetData } =
            await import('@/features/widgets/server/resolveWidgetData');

        const resolved = await resolveWidgetData(['demo.value'], {
            screen: 'dashboard',
            activeWidgetIds: ['widget-demo'],
        });

        expect(resolved['demo.value']).toMatchObject({
            key: 'demo.value',
            status: 'fulfilled',
            data: { count: 3 },
        });
    });

    it('isolates resolver failures', async () => {
        resolverMap.set('demo.good', {
            key: 'demo.good',
            resolve: () => Promise.resolve({ ok: true }),
        });
        resolverMap.set('demo.bad', {
            key: 'demo.bad',
            resolve: () => Promise.reject(new Error('boom')),
        });
        const { resolveWidgetData } =
            await import('@/features/widgets/server/resolveWidgetData');

        const resolved = await resolveWidgetData(['demo.good', 'demo.bad'], {
            screen: 'dashboard',
            activeWidgetIds: ['widget-demo'],
        });

        expect(resolved['demo.good']?.status).toBe('fulfilled');
        expect(resolved['demo.bad']).toMatchObject({
            key: 'demo.bad',
            status: 'rejected',
            error: { code: 'RESOLVER_FAILED' },
        });
    });

    it('turns Zod validation failures into rejected resolver results', async () => {
        resolverMap.set('demo.invalid', {
            key: 'demo.invalid',
            schema: z.object({ count: z.number() }),
            resolve: () => Promise.resolve({ count: 'nope' }),
        });
        const { resolveWidgetData } =
            await import('@/features/widgets/server/resolveWidgetData');

        const resolved = await resolveWidgetData(['demo.invalid'], {
            screen: 'dashboard',
            activeWidgetIds: ['widget-demo'],
        });

        expect(resolved['demo.invalid']).toMatchObject({
            status: 'rejected',
            error: { code: 'RESOLVER_FAILED' },
        });
    });
});
