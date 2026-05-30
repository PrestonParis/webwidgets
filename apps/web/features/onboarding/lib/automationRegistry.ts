import type { AutomationDefinition } from '@/features/onboarding/types/integrations';

export const AUTOMATION_DEFINITIONS: AutomationDefinition[] = [
    {
        id: 'daily-summary',
        name: 'Daily workspace summary',
        summary:
            'Prepare a morning digest from calendar, tasks, notes, and recent activity.',
        goalHints: ['work', 'research', 'software-development', 'school'],
        requiresIntegration: 'google-calendar',
    },
    {
        id: 'streak-warning',
        name: 'Streak warning',
        summary:
            'Warn before recovery, habit, or tracking streaks are likely to go stale.',
        goalHints: ['health-fitness', 'personal-productivity'],
    },
    {
        id: 'email-actions',
        name: 'AI email actions',
        summary:
            'Extract reply, follow-up, and scheduling actions from new messages.',
        goalHints: ['work', 'research'],
        requiresIntegration: 'gmail',
    },
    {
        id: 'tracking-insights',
        name: 'Tracking insights',
        summary:
            'Look for patterns in sleep, mood, recovery, workouts, and routines.',
        goalHints: ['health-fitness'],
    },
    {
        id: 'focus-block-reminder',
        name: 'Focus block reminder',
        summary: 'Suggest timer sessions around open tasks and calendar gaps.',
        goalHints: [
            'work',
            'software-development',
            'research',
            'school',
            'personal-productivity',
        ],
        requiresIntegration: 'google-calendar',
    },
    {
        id: 'workflow-trigger-review',
        name: 'Workflow trigger review',
        summary:
            'Keep a queue of candidate automations to approve as integrations mature.',
        goalHints: ['software-development', 'work'],
    },
];
