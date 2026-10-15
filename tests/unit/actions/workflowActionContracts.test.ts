import { describe, expect, it } from 'vitest';
import {
    workflowActionPayloadSchema,
    workflowCallbackSchema,
} from '@/lib/workflowActions/contracts';
import { parseWorkflowParameters } from '@/lib/n8n/n8nSchemas';
import { hashJson } from '@/lib/lifecycle/idempotency';
const payload = {
    automationConfigId: '71111111-1111-4111-8111-111111111111',
    workflowKey: 'weekly_summary' as const,
    parameters: { weekOf: '2026-08-24' },
};
describe('canonical workflow action contract', () => {
    it('accepts only allowlisted workflow keys and bounded JSON', () => {
        expect(workflowActionPayloadSchema.parse(payload)).toEqual(payload);
        expect(
            workflowActionPayloadSchema.safeParse({
                ...payload,
                workflowKey: 'arbitrary_webhook',
            }).success,
        ).toBe(false);
    });
    it('validates key-specific parameters with the authenticated user', () => {
        expect(
            parseWorkflowParameters(
                'weekly_summary',
                payload.parameters,
                'user-1',
            ),
        ).toEqual({ userId: 'user-1', weekOf: '2026-08-24' });
        expect(() =>
            parseWorkflowParameters(
                'research_item_processing',
                payload.parameters,
                'user-1',
            ),
        ).toThrow();
    });
    it('changes approval identity when config, key, or parameters change', async () => {
        const original = await hashJson(payload);
        expect(
            await hashJson({
                ...payload,
                automationConfigId: '72222222-2222-4222-8222-222222222222',
            }),
        ).not.toBe(original);
        expect(
            await hashJson({
                ...payload,
                parameters: { weekOf: '2026-08-31' },
            }),
        ).not.toBe(original);
    });
    it('requires callback correlation and a terminal status', () => {
        const callback = {
            callbackId: 'callback-1',
            type: 'workflow.completed',
            payload: {
                userId: '73333333-3333-4333-8333-333333333333',
                actionRequestId: '74444444-4444-4444-8444-444444444444',
                jobId: '75555555-5555-4555-8555-555555555555',
                idempotencyKey: 'workflow:key',
                runId: 'run-1',
                result: { ok: true },
            },
        };
        expect(workflowCallbackSchema.safeParse(callback).success).toBe(true);
        expect(
            workflowCallbackSchema.safeParse({ ...callback, callbackId: '' })
                .success,
        ).toBe(false);
    });
});
