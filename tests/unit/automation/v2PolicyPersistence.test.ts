import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { buildConnectionGrants } from '@/app/api/objectives/[id]/policy-decisions/_lib/connections';
import { loadPolicyAuthority } from '@/app/api/objectives/[id]/policy-decisions/_lib/authority';
import { policyEvaluationBodySchema } from '@/app/api/objectives/[id]/policy-decisions/_lib/schemas';

describe('V2 policy persistence boundary', () => {
    it('applies owner predicates before loading any policy authority', async () => {
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
        };
        const db = {
            from: vi.fn(() => query),
        } as unknown as SupabaseClient;
        const userId = '44444444-4444-4444-8444-444444444444';
        await expect(
            loadPolicyAuthority(
                db,
                userId,
                '11111111-1111-4111-8111-111111111111',
                '22222222-2222-4222-8222-222222222222',
                '33333333-3333-4333-8333-333333333333',
            ),
        ).rejects.toMatchObject({ code: 'policy_target_not_found' });
        expect(
            filters.filter(
                ([field, value]) => field === 'user_id' && value === userId,
            ),
        ).toHaveLength(3);
    });

    it('accepts only objective-owned plan and step identifiers from callers', () => {
        expect(
            policyEvaluationBodySchema.parse({
                contractVersion: '2.0',
                planId: '11111111-1111-4111-8111-111111111111',
                stepId: '22222222-2222-4222-8222-222222222222',
            }),
        ).not.toHaveProperty('riskClass');
        expect(() =>
            policyEvaluationBodySchema.parse({
                contractVersion: '2.0',
                planId: '11111111-1111-4111-8111-111111111111',
                stepId: '22222222-2222-4222-8222-222222222222',
                decision: 'allow',
            }),
        ).toThrow();
    });

    it('binds normalized grants to the exact connected provider account', () => {
        const accountId = '33333333-3333-4333-8333-333333333333';
        const connectionId = '44444444-4444-4444-8444-444444444444';
        expect(
            buildConnectionGrants(
                [
                    {
                        id: accountId,
                        provider: 'google',
                        integration_connection_id: connectionId,
                    },
                ],
                [
                    {
                        id: connectionId,
                        provider_id: 'google',
                        state: 'connected',
                        scopes: ['gmail.modify', 'calendar.events'],
                    },
                ],
            ),
        ).toEqual([
            {
                integration: 'google_calendar',
                scopes: ['calendar:write'],
                provider: 'google',
                accountId,
            },
            {
                integration: 'google_mail',
                scopes: ['email:write'],
                provider: 'google',
                accountId,
            },
        ]);
    });

    it('fails closed for disconnected or mismatched connections', () => {
        expect(
            buildConnectionGrants(
                [
                    {
                        id: '33333333-3333-4333-8333-333333333333',
                        provider: 'google',
                        integration_connection_id:
                            '44444444-4444-4444-8444-444444444444',
                    },
                ],
                [
                    {
                        id: '44444444-4444-4444-8444-444444444444',
                        provider_id: 'microsoft',
                        state: 'connected',
                        scopes: ['Mail.ReadWrite'],
                    },
                ],
            ),
        ).toEqual([]);
    });
});
