import { WidgetConfig, WidgetType } from '@/features/dashboard/types/dashboard';
import { Tracker } from '@/features/recovery/types/recovery';
import { base } from '@/features/dashboard/constants';
import { isEntertainmentWidgetType } from '@/features/entertainment/constants';

const KNOWN_WIDGET_TYPES = new Set<string>([
    'texteditor',
    'activity',
    'automation',
    'developer',
    'email',
    'recovery',
    'recovery-empty',
    'converter',
    'countdown',
    'currency',
    'chess',
    'timekeeping',
    'employee-clock',
    'timer',
    'stopwatch',
    'pomodoro',
    'todo',
    'weather',
    'worldclock',
    'journal',
    'notes',
    'scratchpad',
    'calendar',
    'form-filler',
    'datahealth',
    'tracking',
    'folder',
    'tracking-sleep',
    'tracking-workout',
    'tracking-meal',
    'tracking-mood',
    'tracking-supplements',
    'context-diagram',
    'chat',
    'finance',
    'news',
    'widget-builder',
    'files',
    'view',
    'reading',
    'collaboration',
    'command-center',
    'accessibility',
    'memorization',
    'creative',
    'insight-cards',
    'action-cards',
] satisfies WidgetType[]);

export function hydrateTrackers(
    layout: WidgetConfig[],
    trackers: Tracker[],
): WidgetConfig[] {
    return layout.map((w) => {
        if (w.type !== 'recovery') return w;

        const trackerId = w.id.replace('widget-recovery-', '');
        // Fall back to the first available tracker for manually-added widgets
        // whose ID doesn't encode a specific tracker UUID.
        const fresh = trackers.find((t) => t.id === trackerId) ?? trackers[0];

        if (fresh) return { ...w, props: { ...w.props, tracker: fresh } };
        return { ...w, type: 'recovery-empty', props: {} };
    });
}

export function buildDefaultLayout(trackers: Tracker[]): WidgetConfig[] {
    if (trackers.length === 0) {
        return [
            ...base,
            {
                id: 'widget-recovery-none',
                type: 'recovery-empty',
                visible: true,
                columnSpan: 1,
                containerId: 'main',
                order: base.length,
            },
        ];
    }

    const recoveryWidgets: WidgetConfig[] = trackers.map((t, i) => ({
        id: `widget-recovery-${t.id}`,
        type: 'recovery',
        visible: true,
        columnSpan: 1,
        containerId: 'main',
        order: base.length + i,
        props: { tracker: t },
    }));

    return [...base, ...recoveryWidgets];
}

export function buildEmptyLayout(): WidgetConfig[] {
    return [];
}

export function makeSealedKey(userId: string) {
    return `webwidgets_onboarding_sealed_${userId}`;
}

export function makeOnboardingLayoutKey(userId: string) {
    return `webwidgets_onboarding_layout_${userId}`;
}

function isKnownWidgetType(type: string): type is WidgetType {
    return KNOWN_WIDGET_TYPES.has(type);
}

function widgetTypeFromId(id: string): WidgetType | null {
    const withoutPrefix = id.startsWith('widget-') ? id.slice(7) : id;
    const type = withoutPrefix.endsWith('-suggested')
        ? withoutPrefix.slice(0, -10)
        : withoutPrefix;
    return isKnownWidgetType(type) ? type : null;
}

function readOnboardingResetSnapshot(
    userId: string,
    trackers: Tracker[],
): WidgetConfig[] | null {
    try {
        const raw = localStorage.getItem(makeOnboardingLayoutKey(userId));
        if (!raw) return null;
        const layout = JSON.parse(raw) as WidgetConfig[];
        return reconcileLayout(
            layout,
            trackers,
            true,
            readSeenTrackerIds(userId),
        );
    } catch {
        return null;
    }
}

function buildLayoutFromOnboardingProfile(
    userId: string,
): WidgetConfig[] | null {
    try {
        const raw = localStorage.getItem(`webwidgets_onboarding:${userId}`);
        if (!raw) return null;

        const profile = JSON.parse(raw) as {
            completed?: boolean;
            selectedWidgetTypes?: string[];
            generatedWorkspace?: {
                widgetIds?: string[];
                bucketWidgetIds?: string[];
            } | null;
            preferences?: {
                layoutMode?: 'grid' | 'free';
            };
        };

        if (!profile.completed && !profile.generatedWorkspace) return null;

        const selectedTypes = [
            ...(profile.selectedWidgetTypes ?? []),
            ...(profile.generatedWorkspace?.widgetIds ?? [])
                .map(widgetTypeFromId)
                .filter((type): type is WidgetType => type !== null),
        ].filter(isKnownWidgetType);
        const uniqueSelected = [...new Set(selectedTypes)];

        const bucketTypes = (profile.generatedWorkspace?.bucketWidgetIds ?? [])
            .map(widgetTypeFromId)
            .filter(
                (type): type is WidgetType =>
                    type !== null && !uniqueSelected.includes(type),
            );

        const dashboardWidgets = uniqueSelected.map(
            (type, index): WidgetConfig => ({
                id: `widget-${type}`,
                type,
                visible: true,
                columnSpan: 1,
                containerId: 'main',
                order: index,
            }),
        );

        const bucketWidgets = [...new Set(bucketTypes)].map(
            (type, index): WidgetConfig => ({
                id: `widget-${type}-suggested`,
                type,
                visible: true,
                columnSpan: 1,
                containerId: 'bucket',
                order: dashboardWidgets.length + index,
            }),
        );

        return [...dashboardWidgets, ...bucketWidgets];
    } catch {
        return null;
    }
}

export function buildResetLayout(userId: string | null, trackers: Tracker[]) {
    if (!userId) return buildEmptyLayout();

    const snapshot = readOnboardingResetSnapshot(userId, trackers);
    const layout = snapshot ?? buildLayoutFromOnboardingProfile(userId);
    const resetLayout = layout
        ? reconcileLayout(layout, trackers, true, readSeenTrackerIds(userId))
        : buildEmptyLayout();

    localStorage.setItem(makeSealedKey(userId), '1');
    localStorage.setItem(
        makeOnboardingLayoutKey(userId),
        JSON.stringify(resetLayout),
    );

    return resetLayout;
}

export function reconcileLayout(
    savedLayout: WidgetConfig[],
    trackers: Tracker[],
    sealed = false,
    seenTrackerIds: Set<string> = new Set(),
    seenDefaultIds: Set<string> = new Set(),
): WidgetConfig[] {
    // 0. Strip widget types that no longer exist in the codebase (including folder children)
    let working = savedLayout.filter((w) => KNOWN_WIDGET_TYPES.has(w.type));

    // 1. Hydrate saved tracker widgets with fresh data
    working = hydrateTrackers(working, trackers);

    // 2. Inject missing system widgets only when the layout was NOT generated by onboarding.
    // Sealed layouts were intentionally curated — skip default injection to preserve the user's selection.
    // Recovery widgets are excluded here because step 4 handles tracker injection with proper
    // "seen" tracking to avoid re-adding widgets the user explicitly removed.
    // Defaults the user has already seen (and possibly removed) are skipped too — only
    // genuinely new defaults (added by an app update) get injected.
    if (!sealed) {
        const defaults = buildDefaultLayout(trackers);
        const currentIds = new Set(working.map((w) => w.id));
        const missingDefaults = defaults.filter(
            (w) =>
                !currentIds.has(w.id) &&
                !seenDefaultIds.has(w.id) &&
                w.type !== 'recovery' &&
                w.type !== 'recovery-empty',
        );
        if (missingDefaults.length > 0)
            working = [...working, ...missingDefaults];
    }

    // 3. Remove recovery-empty placeholder if real trackers now exist
    if (trackers.length > 0) {
        working = working.filter((w) => w.type !== 'recovery-empty');
    }

    // 4. Append genuinely new trackers — ones the user has never seen in their layout.
    // Trackers in seenTrackerIds were previously injected; if they're no longer in the
    // layout the user deliberately removed them, so we don't re-add them.
    const existingTrackerIds = new Set(
        working
            .filter((w) => w.type === 'recovery')
            .map((w) => w.id.replace('widget-recovery-', '')),
    );
    const newTrackers = trackers.filter(
        (t) => !existingTrackerIds.has(t.id) && !seenTrackerIds.has(t.id),
    );
    if (newTrackers.length > 0) {
        const newWidgets: WidgetConfig[] = newTrackers.map((t, i) => ({
            id: `widget-recovery-${t.id}`,
            type: 'recovery' as const,
            visible: true,
            columnSpan: 1,
            containerId: 'main' as const,
            order: working.length + i,
            props: { tracker: t },
        }));
        working = [...working, ...newWidgets];
    }

    return working;
}

export function makePersistKey(userId: string) {
    return `dashboard_layout_${userId}`;
}

export function makePersistTimestampKey(userId: string) {
    return `dashboard_layout_ts_${userId}`;
}

export function makeSeenTrackersKey(userId: string) {
    return `dashboard_seen_trackers_${userId}`;
}

export function readSeenTrackerIds(userId: string): Set<string> {
    try {
        const raw = localStorage.getItem(makeSeenTrackersKey(userId));
        return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
        return new Set();
    }
}

export function saveSeenTrackerIds(userId: string, ids: Set<string>): void {
    localStorage.setItem(makeSeenTrackersKey(userId), JSON.stringify([...ids]));
}

export function makeSeenDefaultsKey(userId: string) {
    return `dashboard_seen_defaults_${userId}`;
}

export function readSeenDefaultIds(userId: string): Set<string> {
    try {
        const raw = localStorage.getItem(makeSeenDefaultsKey(userId));
        return raw ? new Set(JSON.parse(raw) as string[]) : new Set();
    } catch {
        return new Set();
    }
}

export function saveSeenDefaultIds(userId: string, ids: Set<string>): void {
    localStorage.setItem(makeSeenDefaultsKey(userId), JSON.stringify([...ids]));
}

export function readCachedLayout(userId: string): WidgetConfig[] | null {
    try {
        const raw = localStorage.getItem(makePersistKey(userId));
        return raw ? (JSON.parse(raw) as WidgetConfig[]) : null;
    } catch (e) {
        // clientLogger is not imported here to keep this file server-importable;
        // the error is surfaced to the caller which handles the fallback.
        if (typeof window !== 'undefined') {
            console.error('[dashboard] Cache parse error', e);
        }
        return null;
    }
}

export function readCachedTimestamp(userId: string): string | null {
    return localStorage.getItem(makePersistTimestampKey(userId));
}

/** Removes entertainment widgets (chess, memorization, news, reading, creative) from a layout. */
export function stripEntertainmentWidgets(
    layout: WidgetConfig[],
): WidgetConfig[] {
    return layout.filter((w) => !isEntertainmentWidgetType(w.type));
}
