import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { loadPlanGraph } from '@/app/api/objectives/[id]/plans/[planId]/publish/_lib/loadPlanGraph';

describe('V2 plan publication service', () => {
    it('owner-scopes the plan and every graph child query', async () => {
        const filters: Array<[string, unknown]> = [];
        const query = {
            select: vi.fn(() => query),
            eq: vi.fn((field: string, value: unknown) => {
                filters.push([field, value]);
                return query;
            }),
            maybeSingle: vi.fn(() =>
                Promise.resolve({ data: null, error: null }),
            ),
            then: (
                resolve: (value: { data: unknown[]; error: null }) => unknown,
            ) => resolve({ data: [], error: null }),
        };
        const db = { from: vi.fn(() => query) } as unknown as SupabaseClient;
        const userId = '11111111-1111-4111-8111-111111111111';
        await expect(
            loadPlanGraph(
                db,
                userId,
                '22222222-2222-4222-8222-222222222222',
                '33333333-3333-4333-8333-333333333333',
            ),
        ).rejects.toMatchObject({ code: 'plan_not_found' });
        expect(
            filters.filter(
                ([field, value]) => field === 'user_id' && value === userId,
            ),
        ).toHaveLength(3);
    });
});
