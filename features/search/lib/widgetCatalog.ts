export interface WidgetEntry {
    type: string;
    name: string;
    emoji: string;
    description: string;
    href: string;
    keywords: string[];
}

export const WIDGET_CATALOG: WidgetEntry[] = [
    {
        type: 'journal',
        name: 'Journal',
        emoji: '📓',
        description: 'Write daily entries and reflect on your day',
        href: '/',
        keywords: [
            'journal',
            'diary',
            'write',
            'reflect',
            'notes',
            'log',
            'entries',
        ],
    },
    {
        type: 'email',
        name: 'Email Inbox',
        emoji: '📬',
        description: 'Read and manage your Gmail inbox',
        href: '/inbox',
        keywords: ['email', 'inbox', 'gmail', 'mail', 'messages', 'unread'],
    },
    {
        type: 'chess',
        name: 'Chess',
        emoji: '♟️',
        description: 'Play chess, analyze games, and study openings',
        href: '/chess',
        keywords: [
            'chess',
            'play',
            'game',
            'strategy',
            'puzzle',
            'openings',
            'analysis',
        ],
    },
    {
        type: 'recovery',
        name: 'Recovery Tracker',
        emoji: '🌱',
        description: 'Track sobriety streaks and addiction recovery',
        href: '/',
        keywords: [
            'recovery',
            'sobriety',
            'sober',
            'streak',
            'addiction',
            'quit',
            'clean',
        ],
    },
    {
        type: 'pomodoro',
        name: 'Pomodoro Timer',
        emoji: '🍅',
        description: 'Focus with timed work sessions',
        href: '/',
        keywords: [
            'pomodoro',
            'focus',
            'timer',
            'work',
            'session',
            'deep work',
            'productivity',
        ],
    },
    {
        type: 'todo',
        name: 'To-Do List',
        emoji: '✅',
        description: 'Manage tasks and to-do items',
        href: '/',
        keywords: [
            'todo',
            'tasks',
            'list',
            'checklist',
            'reminder',
            'items',
            'done',
        ],
    },
    {
        type: 'weather',
        name: 'Weather',
        emoji: '🌤️',
        description: 'Check current weather and forecasts',
        href: '/',
        keywords: [
            'weather',
            'forecast',
            'rain',
            'temperature',
            'umbrella',
            'snow',
            'sunny',
        ],
    },
    {
        type: 'worldclock',
        name: 'World Clock',
        emoji: '🕐',
        description: 'See current time across different time zones',
        href: '/',
        keywords: [
            'worldclock',
            'timezone',
            'time',
            'clock',
            'cities',
            'international',
        ],
    },
    {
        type: 'currency',
        name: 'Currency Converter',
        emoji: '💱',
        description: 'Convert between currencies with live rates',
        href: '/',
        keywords: [
            'currency',
            'exchange',
            'convert',
            'dollar',
            'euro',
            'forex',
            'rates',
        ],
    },
    {
        type: 'mood',
        name: 'Mood Tracker',
        emoji: '😊',
        description: 'Log and track your daily emotions',
        href: '/',
        keywords: [
            'mood',
            'emotions',
            'feelings',
            'wellbeing',
            'check-in',
            'mental health',
        ],
    },
    {
        type: 'habit',
        name: 'Habit Tracker',
        emoji: '🔁',
        description: 'Build and maintain daily habits',
        href: '/',
        keywords: [
            'habit',
            'routine',
            'streak',
            'daily',
            'consistency',
            'challenge',
        ],
    },
    {
        type: 'scratchpad',
        name: 'Scratchpad',
        emoji: '📋',
        description: 'Quick notes and temporary text',
        href: '/',
        keywords: [
            'scratchpad',
            'note',
            'quick',
            'draft',
            'memo',
            'clipboard',
            'jot',
        ],
    },
    {
        type: 'countdown',
        name: 'Countdown',
        emoji: '⏳',
        description: 'Count down to upcoming events and deadlines',
        href: '/',
        keywords: [
            'countdown',
            'event',
            'deadline',
            'days',
            'remaining',
            'timer',
            'until',
        ],
    },
    {
        type: 'converter',
        name: 'Unit Converter',
        emoji: '📐',
        description: 'Convert between units of measurement',
        href: '/',
        keywords: [
            'converter',
            'units',
            'convert',
            'metric',
            'imperial',
            'length',
            'weight',
        ],
    },
    {
        type: 'calendar',
        name: 'Calendar',
        emoji: '📅',
        description: 'View your Google Calendar events and schedule',
        href: '/calendar',
        keywords: [
            'calendar',
            'events',
            'schedule',
            'meetings',
            'appointments',
            'agenda',
        ],
    },
];

export function searchWidgets(query: string): WidgetEntry[] {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    return WIDGET_CATALOG.filter(
        (w) =>
            w.name.toLowerCase().includes(q) ||
            w.description.toLowerCase().includes(q) ||
            w.keywords.some((k) => k.includes(q)),
    );
}
