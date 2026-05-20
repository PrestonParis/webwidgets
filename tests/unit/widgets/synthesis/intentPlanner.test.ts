import { describe, expect, it } from 'vitest';
import { parseWidgetIntent } from '@/features/widgets/synthesis/engine/intentParser';
import { planWidgetSynthesis } from '@/features/widgets/synthesis/engine/synthesisPlanner';
import { synthesizeWidgetFromQuery } from '@/features/widgets/synthesis/widgetSearchSynthesis';

describe('widget synthesis intent and planning', () => {
    it('extracts finance forecast intent from natural language', () => {
        const intent = parseWidgetIntent(
            'cashflow forecast for the next month',
        );
        expect(intent.domain).toBe('finance');
        expect(intent.purpose).toBe('visualize');
        expect(intent.visualizationNeeds).toContain('chart');
    });

    it('plans a buildable current-capability widget when sources exist', () => {
        const plan = planWidgetSynthesis('missed email follow-up tracker');
        expect(plan.dataSources).toContain('email.messages');
        expect(plan.components.length).toBeGreaterThan(0);
        expect(plan.confidence).toBeGreaterThan(0.4);
    });

    it('surfaces synthesized candidates with buildability metadata', () => {
        const candidates = synthesizeWidgetFromQuery(
            'portfolio drawdown monitor',
        );
        expect(candidates[0]?.title).toContain('Portfolio');
        expect(candidates[0]).toHaveProperty('buildableNow');
    });
});
