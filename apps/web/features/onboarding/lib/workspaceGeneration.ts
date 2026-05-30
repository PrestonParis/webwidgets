import type {
    WidgetConfig,
    WidgetType,
} from '@/features/dashboard/types/dashboard';
import {
    makePersistKey,
    makePersistTimestampKey,
    makeSealedKey,
} from '@/features/dashboard/lib/dashboardLayout';
import { getDashboardWidgetTypesForGoals } from '@/features/platform/lib/dashboardWidgetLibrary';
import type {
    GeneratedWorkspace,
    OnboardingPreferences,
} from '@/features/onboarding/types/profile';
import type { WorkspaceRecommendation } from '@/features/onboarding/types/recommendations';
import type { UpsertEntryPayload } from '@/features/context/types/context';
import { getWidgetMeta } from '@/features/context/lib/widgetContextMap';
import type { OnboardingGoalId } from '@/features/onboarding/types/goals';

const WIDGET_WIDTH: Partial<Record<WidgetType, number>> = {
    texteditor: 2,
    tracking: 2,
    calendar: 2,
    email: 2,
};

export function buildOnboardingLayout(
    selectedWidgetTypes: WidgetType[],
    suggestedBucketTypes: WidgetType[],
    preferences: OnboardingPreferences,
): WidgetConfig[] {
    const uniqueTypes = [...new Set(selectedWidgetTypes)];
    const dashboardWidgets = uniqueTypes.map((type, index) => {
        // Use canonical IDs (widget-<type>) so reconcileLayout can detect these widgets
        // as already present and skips re-injecting them from the default layout.
        const baseConfig: WidgetConfig = {
            id: `widget-${type}`,
            type,
            visible: true,
            columnSpan:
                preferences.layoutMode === 'grid'
                    ? (WIDGET_WIDTH[type] ?? 1)
                    : 1,
            containerId: 'main',
            order: index,
        };

        if (preferences.layoutMode === 'grid') return baseConfig;

        return {
            ...baseConfig,
            x: 32 + (index % 3) * 340,
            y: 32 + Math.floor(index / 3) * 260,
            w: (WIDGET_WIDTH[type] ?? 1) * 300,
            h: 220,
        };
    });
    const bucketWidgets = [...new Set(suggestedBucketTypes)]
        .filter((type) => !uniqueTypes.includes(type))
        .slice(0, 3)
        .map(
            (type, index): WidgetConfig => ({
                id: `widget-${type}-suggested`,
                type,
                visible: true,
                columnSpan: 1,
                containerId: 'bucket',
                order: dashboardWidgets.length + index,
            }),
        );
    return [...dashboardWidgets, ...bucketWidgets];
}

export interface BucketSuggestionInput {
    selectedWidgetTypes: WidgetType[];
    goals: import('@/features/onboarding/types/goals').OnboardingGoalId[];
    intent: string;
    connectedIntegrationIds: string[];
    recommendation: WorkspaceRecommendation;
}

export function buildSuggestedBucketWidgets(
    input: BucketSuggestionInput,
): WidgetType[] {
    const candidates: WidgetType[] = [
        ...input.recommendation.widgets.map((widget) => widget.widgetType),
        ...getDashboardWidgetTypesForGoals(input.goals),
        ...intentWidgetHints(input.intent),
        ...integrationWidgetHints(input.connectedIntegrationIds),
    ];
    return [...new Set(candidates)]
        .filter((type) => !input.selectedWidgetTypes.includes(type))
        .slice(0, 3);
}

export function persistGeneratedWorkspace(
    userId: string,
    layout: WidgetConfig[],
    preferences: OnboardingPreferences,
) {
    const timestamp = new Date().toISOString();
    localStorage.setItem(makePersistKey(userId), JSON.stringify(layout));
    localStorage.setItem(makePersistTimestampKey(userId), timestamp);
    localStorage.setItem('dash_mode', preferences.layoutMode);
    localStorage.setItem('widget_density', preferences.density);
    localStorage.setItem('workspace_style', preferences.workspaceStyle);
    // Mark this layout as onboarding-generated so reconcileLayout skips default injection.
    localStorage.setItem(makeSealedKey(userId), '1');
}

export function summarizeGeneratedWorkspace(
    layout: WidgetConfig[],
    recommendation: WorkspaceRecommendation,
): GeneratedWorkspace {
    return {
        widgetIds: layout
            .filter((widget) => widget.containerId === 'main')
            .map((widget) => widget.id),
        bucketWidgetIds: layout
            .filter((widget) => widget.containerId === 'bucket')
            .map((widget) => widget.id),
        scenes: buildStarterScenes(recommendation),
        trackingSetup: recommendation.trackingSystems,
        automationIds: recommendation.automations,
    };
}

function intentWidgetHints(intent: string): WidgetType[] {
    const text = intent.toLowerCase();
    const hints: WidgetType[] = [];
    if (text.includes('recover') || text.includes('streak'))
        hints.push('recovery-empty', 'tracking-mood', 'tracking');
    if (
        text.includes('write') ||
        text.includes('note') ||
        text.includes('journal')
    )
        hints.push('texteditor');
    if (text.includes('email') || text.includes('inbox')) hints.push('email');
    if (text.includes('calendar') || text.includes('schedule'))
        hints.push('calendar');
    if (text.includes('habit') || text.includes('task')) hints.push('todo');
    if (text.includes('focus') || text.includes('timer'))
        hints.push('timekeeping');
    return hints;
}

function integrationWidgetHints(integrationIds: string[]): WidgetType[] {
    const hints: WidgetType[] = [];
    if (integrationIds.includes('gmail')) hints.push('email');
    if (integrationIds.includes('google-calendar')) hints.push('calendar');
    if (integrationIds.includes('github')) hints.push('datahealth');
    return hints;
}

export function buildOnboardingContextPayloads(
    name: string,
    goals: OnboardingGoalId[],
    selectedWidgetTypes: WidgetType[],
    connectedIntegrationIds: string[],
    intent: string,
): UpsertEntryPayload[] {
    const payloads: UpsertEntryPayload[] = [];

    payloads.push({
        entityId: 'profile-user',
        entryType: 'profile',
        label: name || 'User',
        data: { onboardedAt: new Date().toISOString(), intent },
    });

    goals.forEach((goal) => {
        payloads.push({
            entityId: `goal-${goal}`,
            entryType: 'goal',
            label: goal.replace(/-/g, ' '),
            data: { source: 'onboarding' },
            linkedTo: ['profile-user'],
        });
    });

    selectedWidgetTypes.forEach((type) => {
        const meta = getWidgetMeta(type);
        const linkedGoals = goals
            .filter((g) => {
                const lower = meta.category.toLowerCase();
                if (g === 'health-fitness') return lower === 'health';
                if (g === 'work' || g === 'personal-productivity')
                    return ['productivity', 'writing'].includes(lower);
                return false;
            })
            .map((g) => `goal-${g}`);
        payloads.push({
            entityId: `widget-${type}`,
            entryType: 'widget',
            label: meta.label,
            data: { category: meta.category, description: meta.description },
            linkedTo:
                linkedGoals.length > 0
                    ? linkedGoals
                    : goals.slice(0, 1).map((g) => `goal-${g}`),
        });
    });

    connectedIntegrationIds.forEach((id) => {
        payloads.push({
            entityId: `integration-${id}`,
            entryType: 'integration',
            label: id,
            data: { connectedAt: new Date().toISOString() },
            linkedTo: ['profile-user'],
        });
    });

    return payloads;
}

function buildStarterScenes(recommendation: WorkspaceRecommendation) {
    const scenes = ['Command center'];
    if (recommendation.trackingSystems.length > 0)
        scenes.push('Tracking review');
    if (recommendation.integrations.includes('github'))
        scenes.push('Developer focus');
    if (
        recommendation.widgets.some(
            (widget) => widget.widgetType === 'texteditor',
        )
    )
        scenes.push('Writing desk');
    return scenes;
}
