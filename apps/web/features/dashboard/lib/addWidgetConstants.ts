import type { LucideIcon } from 'lucide-react';
import {
    BookOpenText,
    Clock3,
    Files,
    HeartPulse,
    Landmark,
    Layers3,
    Mail,
    Newspaper,
    Sparkles,
    Wrench,
} from 'lucide-react';
import type { WidgetType } from '@/features/dashboard/types/dashboard';

export interface WidgetCategory {
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
    types: WidgetType[];
    color: {
        bar: string;
        chip: string;
        icon: string;
    };
}

export const WIDGET_CATEGORIES: WidgetCategory[] = [
    {
        id: 'time',
        label: 'Time',
        description: 'Timers, countdowns, clocks, and focus sessions',
        icon: Clock3,
        types: [
            'timekeeping',
            'timer',
            'stopwatch',
            'countdown',
            'pomodoro',
            'worldclock',
        ],
        color: {
            bar: 'bg-sky-950 text-white border-sky-400/25 hover:bg-sky-900',
            chip: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
            icon: 'bg-sky-400/15 text-sky-200',
        },
    },
    {
        id: 'text',
        label: 'Text Editor',
        description: 'Writing, journals, notes, and scratchpads',
        icon: BookOpenText,
        types: ['texteditor', 'journal', 'notes', 'scratchpad'],
        color: {
            bar: 'bg-emerald-950 text-white border-emerald-400/25 hover:bg-emerald-900',
            chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
            icon: 'bg-emerald-400/15 text-emerald-200',
        },
    },
    {
        id: 'planning',
        label: 'Utilities',
        description: 'Tasks, calendar, email, weather, and personal routines',
        icon: Layers3,
        types: ['todo', 'calendar', 'email', 'calculator', 'weather'],
        color: {
            bar: 'bg-blue-950 text-white border-blue-400/25 hover:bg-blue-900',
            chip: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
            icon: 'bg-blue-400/15 text-blue-200',
        },
    },
    {
        id: 'files',
        label: 'Files',
        description: 'File storage, viewing, and conversion tools',
        icon: Files,
        types: ['files', 'view', 'converter'],
        color: {
            bar: 'bg-amber-950 text-white border-amber-400/25 hover:bg-amber-900',
            chip: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
            icon: 'bg-amber-400/15 text-amber-200',
        },
    },
    {
        id: 'health',
        label: 'Logging and Tracking',
        description:
            'Habits, mood, recovery, workouts, sleep, meals, and supplements',
        icon: HeartPulse,
        types: [
            'habit',
            'recovery-empty',
            'tracking',
            'tracking-mood',
            'tracking-sleep',
            'tracking-workout',
            'tracking-meal',
            'tracking-supplements',
            'tracking-health',
        ],
        color: {
            bar: 'bg-rose-950 text-white border-rose-400/25 hover:bg-rose-900',
            chip: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
            icon: 'bg-rose-400/15 text-rose-200',
        },
    },
    {
        id: 'finance-data',
        label: 'Finance',
        description: 'Markets and money',
        icon: Landmark,
        types: ['finance', 'currency'],
        color: {
            bar: 'bg-lime-950 text-white border-lime-400/25 hover:bg-lime-900',
            chip: 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300',
            icon: 'bg-lime-400/15 text-lime-200',
        },
    },
    {
        id: 'communication',
        label: 'Communication',
        description: 'Chat',
        icon: Mail,
        types: [],
        color: {
            bar: 'bg-cyan-950 text-white border-cyan-400/25 hover:bg-cyan-900',
            chip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300',
            icon: 'bg-cyan-400/15 text-cyan-200',
        },
    },
    {
        id: 'webwidgets',
        label: 'WebWidgets',
        description:
            'AI Chat, collaboration, insights, context, builder tools, and automations',
        icon: Sparkles,
        types: [
            'chat',
            'collaboration',
            'insight-cards',
            'context-diagram',
            'widget-builder',
            'automation',
        ],
        color: {
            bar: 'bg-violet-950 text-white border-violet-400/25 hover:bg-violet-900',
            chip: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
            icon: 'bg-violet-400/15 text-violet-200',
        },
    },
    {
        id: 'creative-intel',
        label: 'Creative & Intel',
        description: 'Research',
        icon: Sparkles,
        types: [],
        color: {
            bar: 'bg-fuchsia-950 text-white border-fuchsia-400/25 hover:bg-fuchsia-900',
            chip: 'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300',
            icon: 'bg-fuchsia-400/15 text-fuchsia-200',
        },
    },
    {
        id: 'tools',
        label: 'Tools',
        description:
            'Employee clock, accessibility, developer, research, and system tools',
        icon: Wrench,
        types: [
            'employee-clock',
            'accessibility',
            'developer',
            'form-filler',
            'research-queue',
        ],
        color: {
            bar: 'bg-slate-950 text-white border-slate-400/25 hover:bg-slate-900',
            chip: 'bg-slate-100 text-slate-700 dark:bg-slate-950 dark:text-slate-300',
            icon: 'bg-slate-400/15 text-slate-200',
        },
    },
    {
        id: 'timeline-intelligence',
        label: 'Timeline Intelligence',
        description: 'Personal events, selected feeds, and relevant changes',
        icon: Newspaper,
        types: ['news'],
        color: {
            bar: 'bg-indigo-950 text-white border-indigo-400/25 hover:bg-indigo-900',
            chip: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
            icon: 'bg-indigo-400/15 text-indigo-200',
        },
    },
    {
        id: 'entertainment',
        label: 'Entertainment',
        description: 'Beta reading, creative, games, and learning experiences',
        icon: Sparkles,
        types: ['chess', 'memorization', 'reading', 'creative'],
        color: {
            bar: 'bg-orange-950 text-white border-orange-400/25 hover:bg-orange-900',
            chip: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
            icon: 'bg-orange-400/15 text-orange-200',
        },
    },
];

export function getWidgetCategory(type: string): WidgetCategory | undefined {
    return WIDGET_CATEGORIES.find((category) =>
        category.types.includes(type as WidgetType),
    );
}
