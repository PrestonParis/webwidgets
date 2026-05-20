import { widgetManifestSchema } from '@/features/widgets/schemas/snapshotSchemas';
import type { WidgetManifest } from '@/features/widgets/types/snapshot';

const manifests = [
    // ── Finance ──────────────────────────────────────────────────────────────
    {
        id: 'finance',
        feature: 'finance',
        title: 'Finance',
        dataNeeds: ['finance.summary'],
        refreshPolicy: 'on-load',
        fallbackMode: 'error-card',
    },
    {
        id: 'converter',
        feature: 'currency',
        title: 'Unit Converter',
        dataNeeds: ['currency.rates.usd'],
        refreshPolicy: 'background',
        fallbackMode: 'stale-cache',
    },
    // ── Communication / Inbox ────────────────────────────────────────────────
    {
        id: 'email',
        feature: 'inbox',
        title: 'Inbox',
        dataNeeds: ['inbox.messages'],
        refreshPolicy: 'on-load',
        fallbackMode: 'empty',
    },
    // ── Calendar / Scheduling ────────────────────────────────────────────────
    {
        id: 'calendar',
        feature: 'calendar',
        title: 'Calendar',
        dataNeeds: ['calendar.events'],
        refreshPolicy: 'on-load',
        fallbackMode: 'skeleton',
    },
    // ── Files / Storage ──────────────────────────────────────────────────────
    {
        id: 'files',
        feature: 'uploads',
        title: 'Files',
        dataNeeds: ['files.recent'],
        refreshPolicy: 'on-load',
        fallbackMode: 'empty',
    },
    // ── Developer ────────────────────────────────────────────────────────────
    {
        id: 'developer',
        feature: 'developer',
        title: 'Developer',
        dataNeeds: ['developer.activity'],
        refreshPolicy: 'background',
        fallbackMode: 'empty',
    },
    // ── Productivity / Tasks ─────────────────────────────────────────────────
    {
        id: 'todo',
        feature: 'todo',
        title: 'To-Do',
        dataNeeds: ['tasks.open'],
        refreshPolicy: 'on-load',
        fallbackMode: 'empty',
    },
    // ── Health Tracking ──────────────────────────────────────────────────────
    {
        id: 'tracking',
        feature: 'tracking',
        title: 'Tracking',
        dataNeeds: ['tracking.today'],
        refreshPolicy: 'on-load',
        fallbackMode: 'empty',
    },
    {
        id: 'tracking-sleep',
        feature: 'tracking',
        title: 'Sleep Tracker',
        dataNeeds: ['tracking.today'],
        refreshPolicy: 'on-load',
        fallbackMode: 'skeleton',
    },
    {
        id: 'tracking-workout',
        feature: 'tracking',
        title: 'Workout Tracker',
        dataNeeds: ['tracking.today'],
        refreshPolicy: 'on-load',
        fallbackMode: 'skeleton',
    },
    {
        id: 'tracking-meal',
        feature: 'tracking',
        title: 'Meal Tracker',
        dataNeeds: ['tracking.today'],
        refreshPolicy: 'on-load',
        fallbackMode: 'skeleton',
    },
    {
        id: 'tracking-mood',
        feature: 'tracking',
        title: 'Mood Tracker',
        dataNeeds: ['tracking.today'],
        refreshPolicy: 'on-load',
        fallbackMode: 'skeleton',
    },
    {
        id: 'tracking-supplements',
        feature: 'tracking',
        title: 'Supplement Tracker',
        dataNeeds: ['tracking.today'],
        refreshPolicy: 'on-load',
        fallbackMode: 'skeleton',
    },
    // ── Recovery ─────────────────────────────────────────────────────────────
    {
        id: 'recovery',
        feature: 'recovery',
        title: 'Recovery',
        dataNeeds: ['recovery.trackers'],
        refreshPolicy: 'on-load',
        fallbackMode: 'skeleton',
    },
    {
        id: 'recovery-empty',
        feature: 'recovery',
        title: 'Recovery (setup)',
        dataNeeds: [],
        refreshPolicy: 'static',
        fallbackMode: 'empty',
    },
    // ── Weather ───────────────────────────────────────────────────────────────
    {
        id: 'weather',
        feature: 'weather',
        title: 'Weather',
        dataNeeds: ['weather.current'],
        refreshPolicy: 'on-load',
        fallbackMode: 'skeleton',
    },
    // ── System / Admin ────────────────────────────────────────────────────────
    {
        id: 'datahealth',
        feature: 'datahealth',
        title: 'System Health',
        dataNeeds: ['datahealth.system'],
        refreshPolicy: 'background',
        fallbackMode: 'error-card',
    },
    {
        id: 'news',
        feature: 'news',
        title: 'News Intel',
        dataNeeds: ['events.feed.ranked'],
        refreshPolicy: 'background',
        fallbackMode: 'stale-cache',
    },
    {
        id: 'view',
        feature: 'view',
        title: 'View',
        dataNeeds: ['files.recent'],
        refreshPolicy: 'on-load',
        fallbackMode: 'empty',
    },
    // ── Static / client-only widgets ─────────────────────────────────────────
    // These widgets manage their own data and do not use the snapshot system.
    {
        id: 'texteditor',
        feature: 'texteditor',
        title: 'Text Editor',
        dataNeeds: [],
        refreshPolicy: 'static',
        fallbackMode: 'skeleton',
    },
    {
        id: 'chess',
        feature: 'chess',
        title: 'Chess',
        dataNeeds: [],
        refreshPolicy: 'static',
        fallbackMode: 'skeleton',
    },
    {
        id: 'worldclock',
        feature: 'worldclock',
        title: 'World Clock',
        dataNeeds: [],
        refreshPolicy: 'static',
        fallbackMode: 'skeleton',
    },
    {
        id: 'mood',
        feature: 'mood',
        title: 'Mood',
        dataNeeds: [],
        refreshPolicy: 'static',
        fallbackMode: 'skeleton',
    },
    {
        id: 'timekeeping',
        feature: 'timekeeping',
        title: 'Timekeeping',
        dataNeeds: [],
        refreshPolicy: 'static',
        fallbackMode: 'skeleton',
    },
    {
        id: 'chat',
        feature: 'chatbot',
        title: 'AI Chat',
        dataNeeds: [],
        refreshPolicy: 'static',
        fallbackMode: 'skeleton',
    },
    {
        id: 'form-filler',
        feature: 'form-filler',
        title: 'Form Filler',
        dataNeeds: [],
        refreshPolicy: 'static',
        fallbackMode: 'skeleton',
    },
    {
        id: 'context-diagram',
        feature: 'context',
        title: 'Context Diagram',
        dataNeeds: [],
        refreshPolicy: 'static',
        fallbackMode: 'skeleton',
    },
    {
        id: 'widget-builder',
        feature: 'widgets',
        title: 'Widget Builder',
        dataNeeds: [],
        refreshPolicy: 'static',
        fallbackMode: 'skeleton',
    },
    {
        id: 'folder',
        feature: 'dashboard',
        title: 'Folder',
        dataNeeds: [],
        refreshPolicy: 'static',
        fallbackMode: 'empty',
    },
] satisfies WidgetManifest[];

export const widgetManifestRegistry = new Map(
    manifests.map((manifest) => {
        const parsed = widgetManifestSchema.parse(manifest);
        return [parsed.id, parsed] as const;
    }),
);

export function getWidgetManifest(
    widgetType: string,
): WidgetManifest | undefined {
    return widgetManifestRegistry.get(widgetType);
}

export function listWidgetManifests(): WidgetManifest[] {
    return [...widgetManifestRegistry.values()];
}
