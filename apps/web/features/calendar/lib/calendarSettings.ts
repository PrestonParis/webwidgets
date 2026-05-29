export interface CalendarCategory {
    id: string;
    name: string;
    colorId: string; // Google Calendar colorId — flows through to the integrated calendar
    defaultDurationMinutes: number;
    emoji: string;
}

export interface CalendarSettings {
    categories: CalendarCategory[];
    defaultDurationMinutes: number;
}

export const DEFAULT_CATEGORIES: CalendarCategory[] = [
    {
        id: 'work',
        name: 'Work',
        colorId: '8',
        defaultDurationMinutes: 60,
        emoji: '💼',
    },
    {
        id: 'meeting',
        name: 'Meeting',
        colorId: '7',
        defaultDurationMinutes: 30,
        emoji: '🤝',
    },
    {
        id: 'personal',
        name: 'Personal',
        colorId: '10',
        defaultDurationMinutes: 60,
        emoji: '🙂',
    },
    {
        id: 'health',
        name: 'Health',
        colorId: '6',
        defaultDurationMinutes: 60,
        emoji: '🏃',
    },
    {
        id: 'focus',
        name: 'Focus',
        colorId: '9',
        defaultDurationMinutes: 90,
        emoji: '🎯',
    },
    {
        id: 'social',
        name: 'Social',
        colorId: '2',
        defaultDurationMinutes: 90,
        emoji: '🎉',
    },
    {
        id: 'learning',
        name: 'Learning',
        colorId: '3',
        defaultDurationMinutes: 60,
        emoji: '📚',
    },
];

export const DEFAULT_SETTINGS: CalendarSettings = {
    categories: DEFAULT_CATEGORIES,
    defaultDurationMinutes: 60,
};

const STORAGE_KEY = 'calendar_settings_v1';

export function loadSettings(): CalendarSettings {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SETTINGS;
        return JSON.parse(raw) as CalendarSettings;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export function saveSettings(settings: CalendarSettings): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// Google Calendar color names for display in settings UI
export const COLOR_ID_LABELS: Record<string, { label: string; bg: string }> = {
    '1': { label: 'Tomato', bg: 'bg-red-400' },
    '2': { label: 'Flamingo', bg: 'bg-pink-400' },
    '3': { label: 'Tangerine', bg: 'bg-orange-400' },
    '4': { label: 'Banana', bg: 'bg-yellow-400' },
    '5': { label: 'Sage', bg: 'bg-green-400' },
    '6': { label: 'Basil', bg: 'bg-emerald-700' },
    '7': { label: 'Peacock', bg: 'bg-teal-400' },
    '8': { label: 'Blueberry', bg: 'bg-blue-500' },
    '9': { label: 'Lavender', bg: 'bg-indigo-300' },
    '10': { label: 'Grape', bg: 'bg-purple-400' },
    '11': { label: 'Graphite', bg: 'bg-zinc-400' },
};
