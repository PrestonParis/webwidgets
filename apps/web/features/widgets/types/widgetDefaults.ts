import type {
    WidgetColor,
    WidgetSize,
    WidgetSettings,
    VisibilitySchedule,
} from './widgets';

export const DEFAULT_SCHEDULE: VisibilitySchedule = {
    enabled: true,
    startTime: '09:00',
    endTime: '17:00',
    days: [],
};

export const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
    color: 'blue',
    size: 'default',
    background: 'default',
    opacity: 100,
    state: 'active',
    pinMode: 'none',
    blur: false,
    redact: false,
    lowProfile: false,
    autoHide: false,
    autoHideDuration: 60,
    backgroundImage: '',
    backgroundBrightness: 100,
};

export const WIDGET_SIZE_DEFAULTS: Record<string, WidgetSize> = {
    calendar: 'default',
};

export const WIDGET_COLOR_DEFAULTS: Record<string, WidgetColor> = {
    texteditor: 'green',
    'research-queue': 'emerald',
    email: 'blue',
    recovery: 'purple',
    converter: 'amber',
    timekeeping: 'orange',
    'employee-clock': 'orange',
    todo: 'blue',
    weather: 'blue',
    worldclock: 'zinc',
    mood: 'pink',
    datahealth: 'emerald',
    tracking: 'emerald',
    'tracking-sleep': 'blue',
    'tracking-workout': 'orange',
    'tracking-meal': 'green',
    'tracking-mood': 'pink',
    'tracking-supplements': 'purple',
};
