import { ReactNode } from 'react';

export type WidgetColor =
    | 'blue'
    | 'green'
    | 'amber'
    | 'purple'
    | 'red'
    | 'emerald'
    | 'zinc'
    | 'pink'
    | 'orange';

export type WidgetSize = 'compact' | 'default' | 'large';

export type WidgetBackground = 'default' | 'glass' | 'solid';

/** Recovery-specific views */
export type RecoveryView = 'timer' | 'heatmap';

export interface WidgetSettings {
    color: WidgetColor;
    size: WidgetSize;
    background: WidgetBackground;
    /** Widget-specific view mode — only used by widgets that support multiple views */
    view?: RecoveryView;
}

export const DEFAULT_WIDGET_SETTINGS: WidgetSettings = {
    color: 'blue',
    size: 'default',
    background: 'default',
};

/** Per-widget color defaults so each widget starts with its own accent */
export const WIDGET_COLOR_DEFAULTS: Record<string, WidgetColor> = {
    journal: 'green',
    email: 'blue',
    recovery: 'purple',
    converter: 'amber',
    pomodoro: 'red',
    todo: 'blue',
    weather: 'blue',
    worldclock: 'zinc',
    currency: 'emerald',
    mood: 'pink',
    habit: 'purple',
    scratchpad: 'amber',
    countdown: 'orange',
};

export interface WidgetShellProps {
    icon: ReactNode;
    title: string;
    badge?: ReactNode;
    children: ReactNode;
    footerHref?: string;
    footerLabel?: string;
    footerSlot?: ReactNode;
    /** Extra controls rendered inside the settings panel (widget-specific) */
    settingsSlot?: ReactNode;
    /** Optional — shell renders with defaults while useWidgetSettings is loading */
    settings?: WidgetSettings;
    onSettingsChange?: (patch: Partial<WidgetSettings>) => void;
}
