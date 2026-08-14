import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db/supabase', () => ({
    supabase: { from: vi.fn(), auth: { getUser: vi.fn() } },
    db: { from: vi.fn() },
}));

import {
    buildOnboardingLayout,
    buildSuggestedBucketWidgets,
} from '@/features/onboarding/lib/workspaceGeneration';
import type { WorkspaceRecommendation } from '@/features/onboarding/types/recommendations';
import { buildWorkspaceRecommendation } from '@/features/onboarding/lib/recommendations';
import { isV1DefaultWidget } from '@/lib/product/v1FeaturePolicy';

const recommendation: WorkspaceRecommendation = {
    widgets: [
        { widgetType: 'chess', reason: 'Beta suggestion', priority: 100 },
        { widgetType: 'todo', reason: 'Stable suggestion', priority: 90 },
    ],
    trackingSystems: [],
    layoutNotes: [],
    integrations: [],
    automations: [],
};

describe('V1 onboarding workspace generation', () => {
    it('keeps generated recommendations within stable V1 scope', () => {
        const generated = buildWorkspaceRecommendation(['school', 'research']);

        expect(
            generated.widgets.every((widget) =>
                isV1DefaultWidget(widget.widgetType),
            ),
        ).toBe(true);
    });

    it('filters beta widgets from generated bucket suggestions', () => {
        const suggestions = buildSuggestedBucketWidgets({
            selectedWidgetTypes: [],
            goals: [],
            intent: '',
            connectedIntegrationIds: [],
            recommendation,
        });

        expect(suggestions).toContain('todo');
        expect(suggestions).not.toContain('chess');
    });

    it('preserves an explicitly selected existing beta widget', () => {
        const layout = buildOnboardingLayout(['chess'], [], {
            layoutMode: 'grid',
            workspaceStyle: 'calm',
            density: 'comfortable',
            complexity: 'guided',
            aiAssistance: 'balanced',
        });

        expect(layout).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'widget-chess',
                    type: 'chess',
                }),
            ]),
        );
    });
});
