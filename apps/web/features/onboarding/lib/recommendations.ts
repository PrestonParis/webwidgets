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
    work: [
        {
            widgetType: 'email',
            reason: 'Stay on top of inbox and surface action items.',
            priority: 96,
        },
        {
            widgetType: 'calendar',
            reason: "Keep today's schedule visible alongside your tasks.",
            priority: 90,
        },
        {
            widgetType: 'todo',
            reason: 'Capture tasks, deadlines, and follow-ups in one place.',
            priority: 88,
        },
        {
            widgetType: 'texteditor',
            reason: 'Quick notes and meeting summaries.',
            priority: 72,
        },
    ],
    school: [
        {
            widgetType: 'todo',
            reason: 'Track assignments, deadlines, and study sessions.',
            priority: 96,
        },
        {
            widgetType: 'calendar',
            reason: 'Class schedules and exam dates in one view.',
            priority: 88,
        },
        {
            widgetType: 'texteditor',
            reason: 'Notes and study summaries stay close to your tasks.',
            priority: 84,
        },
        {
            widgetType: 'timekeeping',
            reason: 'Pomodoro sessions for focused study blocks.',
            priority: 76,
        },
    ],
    'software-development': [
        {
            widgetType: 'todo',
            reason: 'Issue triage and build tasks stay visible.',
            priority: 90,
        },
        {
            widgetType: 'timekeeping',
            reason: 'Deep work sessions separate from maintenance.',
            priority: 84,
        },
        {
            widgetType: 'texteditor',
            reason: 'Scratch notes, architecture decisions, and command references.',
            priority: 76,
        },
        {
            widgetType: 'datahealth',
            reason: 'System health and observability at a glance.',
            priority: 68,
        },
    ],
    'personal-productivity': [
        {
            widgetType: 'todo',
            reason: 'Daily habits and recurring tasks form your routine.',
            priority: 96,
        },
        {
            widgetType: 'calendar',
            reason: 'Your schedule gives tasks the right context.',
            priority: 84,
        },
        {
            widgetType: 'timekeeping',
            reason: 'Focus timers help you do the work, not just plan it.',
            priority: 78,
        },
        {
            widgetType: 'weather',
            reason: 'Ambient context for planning your day.',
            priority: 60,
        },
    ],
    'health-fitness': [
        {
            widgetType: 'tracking',
            reason: 'Log sleep, workouts, and nutrition in one place.',
            priority: 96,
        },
        {
            widgetType: 'tracking-mood',
            reason: 'Mood check-ins reveal patterns over time.',
            priority: 84,
        },
        {
            widgetType: 'todo',
            reason: 'Habit streaks and routine tasks.',
            priority: 74,
        },
        {
            widgetType: 'weather',
            reason: 'Weather affects outdoor workouts and energy.',
            priority: 58,
        },
    ],
    finances: [
        {
            widgetType: 'converter',
            reason: 'Currency and unit conversion for financial work.',
            priority: 88,
        },
        {
            widgetType: 'texteditor',
            reason: 'Notes capture decisions, assumptions, and research.',
            priority: 72,
        },
        {
            widgetType: 'todo',
            reason: 'Action items from financial reviews.',
            priority: 66,
        },
    ],
    research: [
        {
            widgetType: 'texteditor',
            reason: 'Capture, synthesis, and source notes in one surface.',
            priority: 96,
        },
        {
            widgetType: 'todo',
            reason: 'Research queue and next steps.',
            priority: 80,
        },
        {
            widgetType: 'email',
            reason: 'Collect threads and external updates from your inbox.',
            priority: 66,
        },
    ],
    custom: [
        {
            widgetType: 'todo',
            reason: 'A task list is useful in any workspace.',
            priority: 80,
        },
        {
            widgetType: 'texteditor',
            reason: 'Quick capture for ideas and notes.',
            priority: 74,
        },
        {
            widgetType: 'calendar',
            reason: 'Your schedule, always in context.',
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
        goals.length > 0 ? goals : ['personal-productivity'];
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
        ...goals.flatMap((goal) => GOAL_WIDGETS[goal] ?? []),
    ].forEach((item) => {
        const existing = merged.get(item.widgetType);
        if (!existing || item.priority > existing.priority)
            merged.set(item.widgetType, item);
    });

    getDashboardWidgetTypesForGoals([]).forEach((widgetType, index) => {
        if (!merged.has(widgetType)) {
            merged.set(widgetType, {
                widgetType,
                reason: 'A useful addition based on common workspace patterns.',
                priority: 40 - index,
            });
        }
    });

    return [...merged.values()]
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 8);
}

function buildTrackingSystems(goals: OnboardingGoalId[]) {
    const systems: string[] = [];
    if (goals.includes('health-fitness'))
        systems.push('Sleep, mood, workout, and routine logs');
    if (goals.includes('personal-productivity'))
        systems.push('Task completion and focus sessions');
    if (goals.includes('software-development'))
        systems.push('Build, issue, and observability review queue');
    if (goals.includes('finances'))
        systems.push('Budget, rate, and financial note tracking');
    if (goals.includes('school'))
        systems.push('Assignment tracking and study session logs');
    return systems.length > 0
        ? systems
        : ['Task, note, and habit starter tracking'];
}

function buildLayoutNotes(goals: OnboardingGoalId[]) {
    const notes = [
        'Primary widgets land on the main dashboard. You can rearrange or add more at any time.',
    ];
    if (goals.includes('software-development'))
        notes.push(
            'Developer workspaces benefit from a focused scene with tasks, timers, and system health.',
        );
    if (goals.includes('research'))
        notes.push('Writing surfaces should stay wide and visually quiet.');
    return notes;
}
