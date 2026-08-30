import { describe, expect, it } from 'vitest';
import {
    V1_TEMPLATE_CATALOG,
    V1_TEMPLATE_IDS,
} from '@/features/automation/lib/v1TemplateCatalog';

describe('bounded V1 automation catalog', () => {
    it('exposes only the four versioned release templates', () => {
        expect(V1_TEMPLATE_IDS).toEqual([
            'v1.commitment-capture',
            'v1.daily-briefing',
            'v1.calendar-preparation',
            'v1.stale-task-review',
        ]);
        expect(
            Object.values(V1_TEMPLATE_CATALOG).every(
                (definition) => definition.version === 1,
            ),
        ).toBe(true);
    });

    it('requires approval for every state-changing template', () => {
        expect(
            V1_TEMPLATE_CATALOG['v1.commitment-capture'].approvalPolicy
                .required,
        ).toBe(true);
        expect(
            V1_TEMPLATE_CATALOG['v1.calendar-preparation'].approvalPolicy
                .required,
        ).toBe(true);
        expect(
            V1_TEMPLATE_CATALOG['v1.daily-briefing'].approvalPolicy.required,
        ).toBe(false);
        expect(
            V1_TEMPLATE_CATALOG['v1.stale-task-review'].approvalPolicy.required,
        ).toBe(false);
    });

    it('declares bounded inputs, consents, limits, and prohibited effects', () => {
        for (const definition of Object.values(V1_TEMPLATE_CATALOG)) {
            expect(definition.supportedInputs.length).toBeGreaterThan(0);
            expect(definition.limits.runsPerHour).toBeGreaterThan(0);
            expect(definition.limits.costBudgetCents).toBeGreaterThanOrEqual(0);
            expect(definition.prohibitedEffects).toContain('send email');
            expect(definition.defaultEnabled).toBe(false);
        }
    });
});
