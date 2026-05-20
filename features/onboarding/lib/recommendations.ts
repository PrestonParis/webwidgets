import type { WidgetType } from '@/features/dashboard/types/dashboard';
import { AUTOMATION_DEFINITIONS } from '@/features/onboarding/lib/automationRegistry';
import { INTEGRATION_PROVIDERS } from '@/features/onboarding/lib/integrationRegistry';
import { getDashboardWidgetTypesForGoals } from '@/features/platform/lib/dashboardWidgetLibrary';
import type { OnboardingGoalId } from '@/features/onboarding/types/goals';
import type {
    WorkspaceRecommendation,
    WidgetRecommendation,
} from '@/features/onboarding/types/recommendations';

const GOAL_WIDGETS: Record<OnboardingGoalId, WidgetRecommendation[]> = {
    productivity: [
        {
            widgetType: 'todo',
            reason: 'Tasks and habit loops become your daily operating list.',
            priority: 96,
        },
        {
            widgetType: 'timekeeping',
            reason: 'Timers and countdowns support focus blocks and deadlines.',
            priority: 84,
        },
        {
            widgetType: 'calendar',
            reason: 'Calendar context makes the dashboard schedule-aware.',
            priority: 82,
        },
    ],
    'health-tracking': [
        {
            widgetType: 'tracking',
            reason: 'Health systems need a flexible logging surface.',
            priority: 94,
        },
        {
            widgetType: 'mood',
            reason: 'Mood adds qualitative context to health patterns.',
            priority: 78,
        },
        {
            widgetType: 'weather',
            reason: 'Weather can influence outdoor workouts and energy planning.',
            priority: 58,
        },
    ],
    recovery: [
        {
            widgetType: 'recovery-empty',
            reason: 'Recovery tracking is the anchor for streaks and milestones.',
            priority: 98,
        },
        {
            widgetType: 'mood',
            reason: 'Mood check-ins help identify risk patterns.',
            priority: 90,
        },
        {
            widgetType: 'tracking',
            reason: 'Sleep and routine logs strengthen recovery context.',
            priority: 86,
        },
    ],
    development: [
        {
            widgetType: 'timekeeping',
            reason: 'Focused sessions help separate deep work from maintenance.',
            priority: 88,
        },
        {
            widgetType: 'datahealth',
            reason: 'System health is useful for admin and observability workflows.',
            priority: 70,
        },
        {
            widgetType: 'todo',
            reason: 'Task lists keep issue triage and build work visible.',
            priority: 82,
        },
    ],
    finance: [
        {
            widgetType: 'converter',
            reason: 'Currency and unit conversion support finance workflows today.',
            priority: 92,
        },
        {
            widgetType: 'texteditor',
            reason: 'Notes capture assumptions, decisions, and research.',
            priority: 62,
        },
    ],
    research: [
        {
            widgetType: 'texteditor',
            reason: 'Research needs capture, synthesis, and source notes.',
            priority: 94,
        },
        {
            widgetType: 'email',
            reason: 'Inbox context helps collect threads and external updates.',
            priority: 68,
        },
    ],
    'writing-knowledge': [
        {
            widgetType: 'texteditor',
            reason: 'Drafting and editing should be a first-class workspace surface.',
            priority: 98,
        },
        {
            widgetType: 'timekeeping',
            reason: 'Writing sprints benefit from timer support.',
            priority: 70,
        },
    ],
    learning: [
        {
            widgetType: 'todo',
            reason: 'Study habits need repeatable tasks and streaks.',
            priority: 84,
        },
        {
            widgetType: 'texteditor',
            reason: 'Notes and reflections make learning durable.',
            priority: 82,
        },
        {
            widgetType: 'chess',
            reason: 'Practice widgets fit learning-oriented workspaces.',
            priority: 46,
        },
    ],
    automation: [
        {
            widgetType: 'form-filler',
            reason: 'Form filling is the first concrete automation surface.',
            priority: 92,
        },
        {
            widgetType: 'email',
            reason: 'Email is a high-value source for action extraction.',
            priority: 86,
        },
        {
            widgetType: 'calendar',
            reason: 'Calendar data enables schedule-aware triggers.',
            priority: 76,
        },
    ],
    'personal-dashboard': [
        {
            widgetType: 'todo',
            reason: 'Habit streaks and recurring tasks belong at the center.',
            priority: 96,
        },
        {
            widgetType: 'calendar',
            reason: 'Calendar context makes the dashboard feel operational.',
            priority: 86,
        },
        {
            widgetType: 'weather',
            reason: 'Ambient context belongs in a daily command center.',
            priority: 66,
        },
    ],
};

const DEFAULT_WIDGETS: WidgetRecommendation[] = [
    {
        widgetType: 'texteditor',
        reason: 'Every workspace needs quick capture.',
        priority: 54,
    },
    {
        widgetType: 'todo',
        reason: 'Tasks make the setup immediately useful.',
        priority: 52,
    },
];

export function buildWorkspaceRecommendation(
    goals: OnboardingGoalId[],
): WorkspaceRecommendation {
    const selectedGoals: OnboardingGoalId[] =
        goals.length > 0 ? goals : ['productivity'];
    const widgets = rankWidgets(selectedGoals);
    const integrationIds = INTEGRATION_PROVIDERS.filter((provider) =>
        provider.goalHints.some((goal) => selectedGoals.includes(goal)),
    ).map((provider) => provider.id);
    const automationIds = AUTOMATION_DEFINITIONS.filter((automation) =>
        automation.goalHints.some((goal) => selectedGoals.includes(goal)),
    ).map((automation) => automation.id);

    return {
        widgets,
        trackingSystems: buildTrackingSystems(selectedGoals),
        layoutNotes: buildLayoutNotes(selectedGoals),
        integrations: integrationIds,
        automations: automationIds,
    };
}

function rankWidgets(goals: OnboardingGoalId[]): WidgetRecommendation[] {
    const merged = new Map<WidgetType, WidgetRecommendation>();

    [
        ...DEFAULT_WIDGETS,
        ...goals.flatMap((goal) => GOAL_WIDGETS[goal]),
    ].forEach((item) => {
        const existing = merged.get(item.widgetType);
        if (!existing || item.priority > existing.priority)
            merged.set(item.widgetType, item);
    });
    getDashboardWidgetTypesForGoals(goals).forEach((widgetType, index) => {
        if (!merged.has(widgetType)) {
            merged.set(widgetType, {
                widgetType,
                reason: 'Suggested by the reusable WebWidgets registry for your goals.',
                priority: 60 - index,
            });
        }
    });

    return [...merged.values()]
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 8);
}

function buildTrackingSystems(goals: OnboardingGoalId[]) {
    const systems: string[] = [];
    if (goals.includes('recovery'))
        systems.push('Streak and recovery check-ins');
    if (goals.some((goal) => ['health-tracking', 'recovery'].includes(goal)))
        systems.push('Sleep, mood, workout, and routine logs');
    if (goals.includes('productivity'))
        systems.push('Task completion and focus sessions');
    if (goals.includes('development'))
        systems.push('Build, issue, and observability review queue');
    if (goals.includes('finance'))
        systems.push('Currency, rate, and financial note tracking');
    return systems.length > 0
        ? systems
        : ['Task, note, and habit starter tracking'];
}

function buildLayoutNotes(goals: OnboardingGoalId[]) {
    const notes = [
        'Primary widgets stay in the main workspace; future scenes can fork by role or mode.',
    ];
    if (goals.includes('recovery'))
        notes.push(
            'Recovery, mood, and tracking should sit near each other for quick check-ins.',
        );
    if (goals.includes('development'))
        notes.push(
            'Development work benefits from a focused scene with tasks, timers, and system health.',
        );
    if (goals.some((goal) => ['writing-knowledge', 'research'].includes(goal)))
        notes.push('Writing surfaces should stay wide and visually quiet.');
    return notes;
}
