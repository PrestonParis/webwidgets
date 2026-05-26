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

export type WidgetSize = 'compact' | 'default' | 'wide' | 'large';

export type WidgetBackground = 'default' | 'glass' | 'solid';

export type WidgetState =
    | 'active'
    | 'passive'
    | 'dormant'
    | 'suspended'
    | 'archived';

export type PinMode = 'none' | 'viewport' | 'canvas' | 'anchor';

/** Per-edge crop in px — trims the visible area without scaling content */
export interface WidgetCrop {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/** Simple if-then rule for temporal logic automation (runtime eval is a future task) */
export interface TemporalRule {
    id: string;
    enabled: boolean;
    trigger: string;
    action: string;
}

/** Recovery-specific views */
export type RecoveryView = 'timer' | 'heatmap';

/** TextEditor-specific modes */
export type TextEditorMode = 'document' | 'journal' | 'note';

/** Time-specific modes */
export type TimekeepingMode =
    | 'timer'
    | 'pomodoro'
    | 'stopwatch'
    | 'countdown'
    | 'worldclock'
    | 'timeclock';

export interface WidgetSettings {
    color: WidgetColor;
    size: WidgetSize;
    background: WidgetBackground;
    /** 0–100; applied as CSS opacity */
    opacity: number;
    /** Lifecycle state affecting interactivity and compute */
    state: WidgetState;
    /** How the widget is pinned relative to scroll / other widgets */
    pinMode: PinMode;
    /** Privacy: blurs content until clicked */
    blur: boolean;
    /** Privacy: covers content entirely until clicked */
    redact: boolean;
    /** Privacy: shows minimal header-only view until clicked */
    lowProfile: boolean;
    /** Privacy: auto-hides content after inactivity; clears on any mouse/key activity */
    autoHide: boolean;
    /** Inactivity duration in seconds before auto-hide triggers (default 60) */
    autoHideDuration: number;
    /** Widget-specific view mode — only used by widgets that support multiple views */
    view?: RecoveryView;
    /** TextEditor mode — document, journal, or note */
    textEditorMode?: TextEditorMode;
    /** Time mode — timer, pomodoro, stopwatch, countdown, or world clock */
    timekeepingMode?: TimekeepingMode;
    /** Scheduled visibility window */
    schedule?: VisibilitySchedule;
    /** Widget to anchor position to in free canvas (requires pinMode === 'anchor') */
    anchorId?: string;
    /** Per-edge crop in px */
    crop?: WidgetCrop;
    /** Temporal automation rules */
    rules?: TemporalRule[];
    /** Image URL used as the widget background (empty string = none) */
    backgroundImage: string;
    /** Brightness of the background image (0–100, default 100) */
    backgroundBrightness: number;
    /** User-defined title override (undefined = use widget default) */
    customTitle?: string;
}

export interface VisibilitySchedule {
    enabled: boolean;
    startTime: string; // "HH:MM" 24-hour
    endTime: string; // "HH:MM"
    days: number[]; // 0=Sun…6=Sat; empty array = every day
}
