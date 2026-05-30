import type {
    FocusAreaDefinition,
    GoalDefinition,
} from '@/features/onboarding/types/goals';

export const GOAL_DEFINITIONS: GoalDefinition[] = [
    {
        id: 'work',
        label: 'Work',
        emoji: '💼',
        summary: 'Email, tasks, planning, meetings',
    },
    {
        id: 'school',
        label: 'School',
        emoji: '🎓',
        summary: 'Study, assignments, schedules, research',
    },
    {
        id: 'software-development',
        label: 'Software Development',
        emoji: '💻',
        summary: 'Code, GitHub, builds, issues',
    },
    {
        id: 'personal-productivity',
        label: 'Personal Productivity',
        emoji: '✅',
        summary: 'Habits, todos, reminders, focus',
    },
    {
        id: 'health-fitness',
        label: 'Health & Fitness',
        emoji: '🏃',
        summary: 'Tracking, sleep, workouts, nutrition',
    },
    {
        id: 'finances',
        label: 'Finances',
        emoji: '💰',
        summary: 'Budget, investments, expense tracking',
    },
    {
        id: 'research',
        label: 'Research',
        emoji: '🔬',
        summary: 'Reading, notes, synthesis, sources',
    },
    {
        id: 'custom',
        label: 'Something else',
        emoji: '✨',
        summary: "I'll configure my own workspace",
    },
];

export const FOCUS_AREA_DEFINITIONS: FocusAreaDefinition[] = [
    { id: 'email', label: 'Email', emoji: '📬' },
    { id: 'calendar', label: 'Calendar', emoji: '📅' },
    { id: 'tasks', label: 'Tasks & Todos', emoji: '✅' },
    { id: 'notes', label: 'Notes & Writing', emoji: '📝' },
    { id: 'documents', label: 'Documents', emoji: '📄' },
    { id: 'research-queue', label: 'Research Queue', emoji: '🔍' },
    { id: 'habits', label: 'Habits & Tracking', emoji: '🔄' },
    { id: 'health', label: 'Health & Recovery', emoji: '❤️' },
    { id: 'finance', label: 'Finance', emoji: '💳' },
    { id: 'collaboration', label: 'Team Collaboration', emoji: '🤝' },
];
