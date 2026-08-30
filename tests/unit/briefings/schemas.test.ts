import { describe, expect, it } from 'vitest';
import { briefingResponseSchema } from '@/lib/briefings/schemas';

describe('briefing response schema', () => {
    it('accepts database timestamps with UTC offsets', () => {
        const parsed = briefingResponseSchema.safeParse({
            briefing: {
                id: '11111111-1111-4111-8111-111111111111',
                status: 'ready',
                trigger: 'on_demand',
                coveredFrom: '2026-08-19T11:00:00+00:00',
                coveredTo: '2026-08-19T12:00:00+00:00',
                generatedAt: '2026-08-19T12:01:00+00:00',
                expiresAt: '2026-08-21T12:00:00+00:00',
                modelProvider: 'deterministic',
                modelName: 'rules',
                modelVersion: 'v1',
                ruleVersion: 'v1',
                warnings: [],
                inputEventCount: 1,
                latencyMs: 10,
                estimatedCostUsd: null,
                failureCode: null,
                items: [],
            },
            preferences: {
                dailyEnabled: false,
                localTime: '09:00',
                timezone: 'UTC',
                windowHours: 24,
            },
            activeJobId: null,
        });

        expect(parsed.success).toBe(true);
    });
});
