import type { GoalDefinition } from '@/features/onboarding/types/goals';

export const GOAL_DEFINITIONS: GoalDefinition[] = [
    {
        id: 'productivity',
        label: 'Productivity',
        summary: 'Tasks, focus, deadlines',
        details:
            'Coordinate to-dos, timers, calendar context, and quick capture.',
    },
    {
        id: 'health-tracking',
        label: 'Health and tracking',
        summary: 'Sleep, workouts, meals',
        details:
            'Prepare tracking systems for body metrics, routines, and insights.',
    },
    {
        id: 'recovery',
        label: 'Recovery',
        summary: 'Streaks and check-ins',
        details:
            'Surface recovery, mood, sleep, reminders, and streak protection.',
    },
    {
        id: 'finance',
        label: 'Finance tracking',
        summary: 'Money and rates',
        details:
            'Start with conversion tools and future budget or portfolio systems.',
    },
    {
        id: 'development',
        label: 'Development',
        summary: 'Code workflows',
        details:
            'Prepare GitHub, terminal-adjacent tools, observability, and focus blocks.',
    },
    {
        id: 'writing-knowledge',
        label: 'Writing and knowledge',
        summary: 'Notes, journal, archive',
        details:
            'Prioritize writing surfaces, source capture, research queues, and daily reflection.',
    },
    {
        id: 'research',
        label: 'Research',
        summary: 'Reading and synthesis',
        details: 'Organize notes, sources, summaries, and knowledge workflows.',
    },
    {
        id: 'automation',
        label: 'Automation',
        summary: 'Rules and triggers',
        details:
            'Expose integrations, form filling, summaries, and workflow triggers.',
    },
    {
        id: 'learning',
        label: 'Learning',
        summary: 'Study and practice',
        details:
            'Combine study widgets, habit loops, notes, and spaced review hooks.',
    },
    {
        id: 'personal-dashboard',
        label: 'Personal dashboard',
        summary: 'All-purpose command center',
        details:
            'Start broad with calendar, notes, tasks, weather, and activity context.',
    },
];
