import {
    AudioLines,
    Brain,
    Eye,
    Keyboard,
    MousePointer2,
    Sparkles,
} from 'lucide-react';
import type {
    AccessibilityAuditItem,
    AccessibilityMode,
    AccessibilityPreference,
} from './types/accessibility';

export const accessibilityPreferences: AccessibilityPreference[] = [
    {
        id: 'pref-contrast',
        category: 'Vision',
        label: 'Increase interface contrast',
        description:
            'Strengthen borders, text contrast, and active-state distinction across widgets.',
        enabled: false,
        control: 'toggle',
    },
    {
        id: 'pref-motion',
        category: 'Motion',
        label: 'Reduce motion',
        description:
            'Limit animated transitions, moving backgrounds, and nonessential motion.',
        enabled: false,
        control: 'toggle',
    },
    {
        id: 'pref-focus',
        category: 'Keyboard',
        label: 'Persistent focus outlines',
        description:
            'Show strong focus rings for buttons, menus, forms, widgets, and canvas controls.',
        enabled: true,
        control: 'toggle',
    },
    {
        id: 'pref-density',
        category: 'Cognitive',
        label: 'Interface density',
        description:
            'Tune spacing and information density for lower cognitive load or power usage.',
        enabled: true,
        control: 'slider',
        value: 50,
    },
    {
        id: 'pref-captions',
        category: 'Audio',
        label: 'Transcription-first audio',
        description:
            'Prioritize transcripts for voice notes, videos, and audio summaries.',
        enabled: false,
        control: 'toggle',
    },
];

export const accessibilityAudits: AccessibilityAuditItem[] = [
    {
        id: 'audit-dashboard-focus',
        title: 'Free canvas keyboard drag path',
        surface: 'Dashboard',
        category: 'Keyboard',
        severity: 'high',
        status: 'needs-review',
        recommendation:
            'Add step-based movement controls and a visible snap target announcer.',
    },
    {
        id: 'audit-finance-redaction',
        title: 'Sensitive finance values need clearer reveal state',
        surface: 'Finance',
        category: 'Vision',
        severity: 'medium',
        status: 'needs-review',
        recommendation:
            'Pair blur state with icon and button copy that names the reveal action.',
    },
    {
        id: 'audit-charts',
        title: 'Chart data needs table fallback',
        surface: 'Tracking',
        category: 'Cognitive',
        severity: 'high',
        status: 'failing',
        recommendation:
            'Expose a compact table view for line, bar, heatmap, and radar charts.',
    },
    {
        id: 'audit-animations',
        title: 'Notification motion obeys preference',
        surface: 'Notifications',
        category: 'Motion',
        severity: 'low',
        status: 'passing',
        recommendation:
            'Keep toast entrance animation disabled when reduced motion is active.',
    },
    {
        id: 'audit-audio',
        title: 'Voice journal requires transcript review',
        surface: 'Journal',
        category: 'Audio',
        severity: 'medium',
        status: 'needs-review',
        recommendation:
            'Let users correct generated transcripts before saving entries.',
    },
];

export const accessibilityModes: AccessibilityMode[] = [
    {
        id: 'mode-1d',
        name: '1D simplified mode',
        description:
            'Single-column, accessibility-first workspace. Forces a stable vertical stack, hides advanced controls, and enlarges widgets for focused, distraction-free interaction.',
        category: 'Cognitive',
        enabled: false,
        affectedSurfaces: ['Dashboard'],
    },
    {
        id: 'mode-reader',
        name: 'Reader comfort',
        description:
            'Larger reading width, calmer contrast, reduced controls, and citation-friendly spacing.',
        category: 'Vision',
        enabled: false,
        affectedSurfaces: ['Reading', 'Knowledge', 'Journal'],
    },
    {
        id: 'mode-keyboard',
        name: 'Keyboard operator',
        description:
            'Command-first navigation, focus map, skip links, and explicit movement controls.',
        category: 'Keyboard',
        enabled: false,
        affectedSurfaces: ['Dashboard', 'Search', 'Settings'],
    },
    {
        id: 'mode-low-load',
        name: 'Low cognitive load',
        description:
            'Simplifies dense views, groups actions, and suppresses nonurgent signals.',
        category: 'Cognitive',
        enabled: false,
        affectedSurfaces: ['Command Center', 'Tracking', 'Finance'],
    },
];

export const categoryIcons = {
    Vision: Eye,
    Motion: MousePointer2,
    Keyboard,
    Cognitive: Brain,
    Audio: AudioLines,
};

export const sparkleIcon = Sparkles;
