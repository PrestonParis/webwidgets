import type { WidgetType } from '@/features/dashboard/types/dashboard';
import { WIDGET_CATALOG } from '@/features/search/lib/widgetCatalog';
import { WIDGET_REGISTRY } from '@/features/platform/registry/widgetRegistry';
import type { WidgetDefinition } from '@/features/platform/types/widgetTypes';
import type { OnboardingGoalId } from '@/features/onboarding/types/goals';

export interface DashboardWidgetLibraryEntry {
    type: WidgetType;
    name: string;
    description: string;
    emoji: string;
    adminOnly?: boolean;
    betaState: WidgetDefinition['betaState'];
    featureId: string;
}

const RENDERABLE_WIDGET_TYPES: readonly WidgetType[] = [
    'texteditor',
    'research-queue',
    'activity',
    'automation',
    'developer',
    'email',
    'recovery',
    'recovery-empty',
    'converter',
    'countdown',
    'currency',
    'chess',
    'timekeeping',
    'pomodoro',
    'todo',
    'habit',
    'weather',
    'worldclock',
    'mood',
    'journal',
    'notes',
    'scratchpad',
    'calendar',
    'form-filler',
    'datahealth',
    'tracking',
    'tracking-sleep',
    'tracking-workout',
    'tracking-meal',
    'tracking-mood',
    'tracking-supplements',
    'context-diagram',
    'chat',
    'finance',
    'widget-builder',
    'files',
    'folder',
    'reading',
    'news',
    'view',
    'collaboration',
    'command-center',
    'accessibility',
    'memorization',
    'creative',
    'insight-cards',
    'action-cards',
];

const EMOJI_BY_FEATURE: Record<string, string> = {
    activity: '🔔',
    automation: '⚙️',
    developer: '🧰',
    finance: '💵',
    knowledge: '✍️',
    news: '🗞️',
    tracking: '📊',
};

const WIDGET_COMPLEXITY_ORDER: readonly WidgetType[] = [
    'worldclock',
    'countdown',
    'pomodoro',
    'weather',
    'currency',
    'converter',
    'scratchpad',
    'notes',
    'journal',
    'texteditor',
    'todo',
    'habit',
    'mood',
    'calendar',
    'email',
    'files',
    'news',
    'reading',
    'chess',
    'tracking-mood',
    'tracking-sleep',
    'tracking-meal',
    'tracking-workout',
    'tracking-supplements',
    'tracking',
    'finance',
    'recovery-empty',
    'recovery',
    'activity',
    'form-filler',
    'view',
    'context-diagram',
    'research-queue',
    'memorization',
    'creative',
    'collaboration',
    'insight-cards',
    'action-cards',
    'automation',
    'chat',
    'command-center',
    'widget-builder',
    'developer',
    'datahealth',
    'accessibility',
    'folder',
];

const WIDGET_COMPLEXITY_RANK = new Map(
    WIDGET_COMPLEXITY_ORDER.map((type, index) => [type, index]),
);

export function isRenderableWidgetType(type: string): type is WidgetType {
    return RENDERABLE_WIDGET_TYPES.includes(type as WidgetType);
}

export function getDashboardWidgetLibrary() {
    const registryEntries = WIDGET_REGISTRY.filter(
        (widget) =>
            widget.surfaces.includes('dashboard') &&
            isRenderableWidgetType(widget.type),
    ).map(toLibraryEntry);
    const catalogEntries = WIDGET_CATALOG.flatMap(
        (entry): DashboardWidgetLibraryEntry[] => {
            if (!isRenderableWidgetType(entry.type)) return [];
            return [
                {
                    type: entry.type,
                    name: entry.name,
                    description: entry.description,
                    emoji: entry.emoji,
                    betaState: 'stable',
                    featureId: entry.type,
                    ...(entry.adminOnly !== undefined && {
                        adminOnly: entry.adminOnly,
                    }),
                },
            ];
        },
    );
    const byType = new Map<WidgetType, DashboardWidgetLibraryEntry>();
    [...catalogEntries, ...registryEntries].forEach((entry) =>
        byType.set(entry.type, entry),
    );
    return [...byType.values()].sort(sortByComplexity);
}

export function getDashboardWidgetTypesForGoals(goals: OnboardingGoalId[]) {
    return WIDGET_REGISTRY.filter((widget) =>
        widget.goals.some((goal) => goals.includes(goal)),
    )
        .map((widget) => widget.type)
        .filter(isRenderableWidgetType);
}

function toLibraryEntry(widget: WidgetDefinition): DashboardWidgetLibraryEntry {
    return {
        type: isRenderableWidgetType(widget.type) ? widget.type : 'texteditor',
        name: widget.name,
        description: widget.description,
        emoji: EMOJI_BY_FEATURE[widget.featureId] ?? '🧩',
        betaState: widget.betaState,
        featureId: widget.featureId,
    };
}

function sortByComplexity(
    a: DashboardWidgetLibraryEntry,
    b: DashboardWidgetLibraryEntry,
) {
    const aRank = WIDGET_COMPLEXITY_RANK.get(a.type) ?? Number.MAX_SAFE_INTEGER;
    const bRank = WIDGET_COMPLEXITY_RANK.get(b.type) ?? Number.MAX_SAFE_INTEGER;
    if (aRank !== bRank) return aRank - bRank;
    return a.name.localeCompare(b.name);
}
