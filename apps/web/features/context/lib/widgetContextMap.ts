import type { WidgetType } from '@/features/dashboard/types/dashboard';

export interface WidgetContextMeta {
    label: string;
    category: string;
    description: string;
}

export const WIDGET_CONTEXT_MAP: Partial<
    Record<WidgetType, WidgetContextMeta>
> = {
    email: {
        label: 'Email Inbox',
        category: 'Communication',
        description: 'Gmail inbox with AI action extraction',
    },
    calendar: {
        label: 'Calendar',
        category: 'Productivity',
        description: 'Google Calendar event management',
    },
    todo: {
        label: 'Tasks',
        category: 'Productivity',
        description: 'Task list and habit tracking',
    },
    texteditor: {
        label: 'Text Editor',
        category: 'Writing',
        description: 'Notes, journal, and long-form editor',
    },
    tracking: {
        label: 'Tracking',
        category: 'Health',
        description: 'Sleep, workout, meal, and mood logs',
    },
    mood: {
        label: 'Mood',
        category: 'Health',
        description: 'Daily mood and energy logging',
    },
    timekeeping: {
        label: 'Time',
        category: 'Productivity',
        description: 'Timer, Pomodoro, stopwatch, countdowns, and world clock',
    },
    weather: {
        label: 'Weather',
        category: 'Ambient',
        description: 'Local weather forecast',
    },
    worldclock: {
        label: 'World Clock',
        category: 'Ambient',
        description: 'Multi-timezone clock',
    },
    converter: {
        label: 'Converter',
        category: 'Utility',
        description: 'Unit and currency conversion',
    },
    chess: {
        label: 'Chess',
        category: 'Games',
        description: 'Chess analysis and game study',
    },
    'recovery-empty': {
        label: 'Recovery',
        category: 'Health',
        description: 'Streak and sobriety tracking',
    },
    recovery: {
        label: 'Recovery',
        category: 'Health',
        description: 'Active recovery tracker',
    },
    datahealth: {
        label: 'System Health',
        category: 'Developer',
        description: 'API and service health monitoring',
    },
    'form-filler': {
        label: 'Form Filler',
        category: 'Productivity',
        description: 'Automated form completion',
    },
    'tracking-sleep': {
        label: 'Sleep Tracker',
        category: 'Health',
        description: 'Sleep quality and duration',
    },
    'tracking-workout': {
        label: 'Workout Tracker',
        category: 'Health',
        description: 'Workout logs and volume',
    },
    'tracking-meal': {
        label: 'Meal Tracker',
        category: 'Health',
        description: 'Meals and nutrition logging',
    },
    'tracking-mood': {
        label: 'Mood Tracker',
        category: 'Health',
        description: 'Mood and energy trends',
    },
    'tracking-supplements': {
        label: 'Supplements',
        category: 'Health',
        description: 'Supplement adherence tracking',
    },
};

export function getWidgetMeta(type: WidgetType): WidgetContextMeta {
    return (
        WIDGET_CONTEXT_MAP[type] ?? {
            label: type,
            category: 'Widget',
            description: '',
        }
    );
}
