import { describe, expect, it } from 'vitest';
import {
    getDashboardWidgetLibrary,
    getDashboardWidgetTypesForGoals,
} from '@/features/platform/lib/dashboardWidgetLibrary';
import { getWidgetCategory } from '@/features/dashboard/lib/addWidgetConstants';
import { recommendWidgetsForContext } from '@/features/platform/lib/assembly';
import type { AssemblyContext } from '@/features/platform/types/assembly';
import { isV1DefaultWidget } from '@/lib/product/v1FeaturePolicy';

const assemblyContext: AssemblyContext = {
    goals: ['software-development'],
    selectedWidgetIds: [],
    enabledFeatureIds: ['developer'],
    connectedIntegrationIds: ['github'],
    grantedPermissions: [],
    accountState: 'authenticated',
    density: 'comfortable',
    showBeta: false,
};

describe('V1 widget library', () => {
    it.each(['chess', 'memorization', 'reading'] as const)(
        'exposes %s as beta for deliberate discovery',
        (widgetType) => {
            const entry = getDashboardWidgetLibrary().find(
                (widget) => widget.type === widgetType,
            );
            expect(entry?.betaState).toBe('beta');
        },
    );

    it('keeps Timeline Intelligence stable and outside Entertainment', () => {
        const timeline = getDashboardWidgetLibrary().find(
            (widget) => widget.type === 'news',
        );
        expect(timeline).toMatchObject({
            betaState: 'stable',
            name: 'Timeline Intelligence',
        });
        expect(getWidgetCategory('news')?.id).toBe('timeline-intelligence');
        expect(getWidgetCategory('chess')?.id).toBe('entertainment');
    });

    it('excludes beta widgets from goal-generated defaults', () => {
        const defaultTypes = getDashboardWidgetTypesForGoals([
            'school',
            'research',
        ]);

        expect(defaultTypes.every(isV1DefaultWidget)).toBe(true);
    });

    it('requires an explicit beta preference for smart recommendations', () => {
        expect(
            recommendWidgetsForContext(assemblyContext).some(
                (widget) => widget.id === 'developer',
            ),
        ).toBe(false);
        expect(
            recommendWidgetsForContext({
                ...assemblyContext,
                showBeta: true,
            }).some((widget) => widget.id === 'developer'),
        ).toBe(true);
    });
});
