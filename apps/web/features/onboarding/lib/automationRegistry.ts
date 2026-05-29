import type { AutomationDefinition } from '@/features/onboarding/types/integrations';

export const AUTOMATION_DEFINITIONS: AutomationDefinition[] = [
    {
        id: 'daily-summary',
        name: 'Daily workspace summary',
        summary:
            'Prepare a morning digest from calendar, tasks, notes, and recent activity.',
        goalHints: ['productivity', 'research', 'development', 'learning'],
        requiresIntegration: 'google-calendar',
    },
    {
        id: 'streak-warning',
        name: 'Streak warning',
        summary:
            'Warn before recovery, habit, or tracking streaks are likely to go stale.',
        goalHints: ['recovery', 'health-tracking'],
    },
    {
        id: 'email-actions',
        name: 'AI email actions',
        summary:
            'Extract reply, follow-up, and scheduling actions from new messages.',
        goalHints: ['productivity', 'automation', 'research'],
        requiresIntegration: 'gmail',
    },
    {
        id: 'tracking-insights',
        name: 'Tracking insights',
        summary:
            'Look for patterns in sleep, mood, recovery, workouts, and routines.',
        goalHints: ['health-tracking', 'recovery'],
    },
    {
        id: 'focus-block-reminder',
        name: 'Focus block reminder',
        summary: 'Suggest timer sessions around open tasks and calendar gaps.',
        goalHints: [
            'productivity',
            'development',
            'writing-knowledge',
            'learning',
        ],
        requiresIntegration: 'google-calendar',
    },
    {
        id: 'workflow-trigger-review',
        name: 'Workflow trigger review',
        summary:
            'Keep a queue of candidate automations to approve as integrations mature.',
        goalHints: ['automation', 'development'],
    },
];
