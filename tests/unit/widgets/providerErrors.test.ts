import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/supabase', () => ({
    supabase: { from: vi.fn(), auth: { getUser: vi.fn() } },
    db: { from: vi.fn() },
}));
import { z } from 'zod';
import type { DataResolver } from '@/features/widgets/types/snapshot';
import { ProviderError } from '@/lib/connectors/providerError';

const resolverMap = new Map<string, DataResolver>();

vi.mock('@/features/widgets/registry/widgetDataRegistry', () => ({
    getDataResolver: (key: string) => resolverMap.get(key),
}));

vi.mock('@/lib/observability/sentry', () => ({
    captureError: vi.fn(),
}));

const ctx = { screen: 'dashboard', activeWidgetIds: [] as string[] };

describe('provider error isolation', () => {
    it('PROVIDER_NOT_CONFIGURED does not crash the snapshot — returns empty data', async () => {
        resolverMap.clear();
        resolverMap.set('inbox.messages', {
            key: 'inbox.messages',
            resolve: async () => {
                throw new ProviderError(
                    'PROVIDER_NOT_CONFIGURED',
                    'Gmail not connected',
                );
            },
        });
        resolverMap.set('finance.summary', {
            key: 'finance.summary',
            schema: z.object({ total: z.number() }),
            resolve: async () => ({ total: 42 }),
        });

        const { resolveWidgetData } =
            await import('@/features/widgets/server/resolveWidgetData');
        const resolved = await resolveWidgetData(
            ['inbox.messages', 'finance.summary'],
            ctx,
        );

        expect(resolved['inbox.messages']?.status).toBe('rejected');
        expect(resolved['inbox.messages']?.error?.code).toBe('RESOLVER_FAILED');
        expect(resolved['finance.summary']?.status).toBe('fulfilled');
        expect(resolved['finance.summary']?.data).toEqual({ total: 42 });
    });

    it('one failing resolver does not prevent others from resolving', async () => {
        resolverMap.clear();
        const resolverKeys = [
            'tasks.open',
            'calendar.events',
            'recovery.trackers',
        ];
        resolverMap.set(resolverKeys[0]!, {
            key: resolverKeys[0]!,
            resolve: async () => ({ items: [] }),
        });
        resolverMap.set(resolverKeys[1]!, {
            key: resolverKeys[1]!,
            resolve: async () => {
                throw new Error('calendar unavailable');
            },
        });
        resolverMap.set(resolverKeys[2]!, {
            key: resolverKeys[2]!,
            resolve: async () => ({ trackers: [] }),
        });

        const { resolveWidgetData } =
            await import('@/features/widgets/server/resolveWidgetData');
        const resolved = await resolveWidgetData(resolverKeys, ctx);

        expect(resolved['tasks.open']?.status).toBe('fulfilled');
        expect(resolved['calendar.events']?.status).toBe('rejected');
        expect(resolved['recovery.trackers']?.status).toBe('fulfilled');
    });

    it('ProviderError exposed code does not leak raw messages to client', async () => {
        resolverMap.clear();
        resolverMap.set('developer.activity', {
            key: 'developer.activity',
            resolve: async () => {
                throw new ProviderError(
                    'PROVIDER_UNAUTHORIZED',
                    'secret token abc123 is invalid',
                );
            },
        });

        const { resolveWidgetData } =
            await import('@/features/widgets/server/resolveWidgetData');
        const resolved = await resolveWidgetData(['developer.activity'], ctx);

        const error = resolved['developer.activity']?.error;
        expect(error?.code).toBe('RESOLVER_FAILED');
        expect(error?.message).not.toContain('abc123');
        expect(error?.message).not.toContain('secret token');
    });
});
