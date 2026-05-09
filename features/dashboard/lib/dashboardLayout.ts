import { WidgetConfig } from '@/features/dashboard/types/dashboard';
import { Tracker } from '@/features/recovery/types/recovery';
import { base } from '@/features/dashboard/constants';

export function hydrateTrackers(
    layout: WidgetConfig[],
    trackers: Tracker[],
): WidgetConfig[] {
    return layout.map((w) => {
        if (w.type !== 'recovery') return w;

        const trackerId = w.id.replace('widget-recovery-', '');
        const fresh = trackers.find((t) => t.id === trackerId);

        if (fresh) return { ...w, props: { ...w.props, tracker: fresh } };
        return { ...w, type: 'recovery-empty', props: {} };
    });
}

export function buildDefaultLayout(trackers: Tracker[]): WidgetConfig[] {
    if (trackers.length === 0) {
        base.push({
            id: 'widget-recovery-none',
            type: 'recovery-empty',
            visible: true,
            columnSpan: 1,
            containerId: 'main',
            order: 4,
        });
        return base;
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

export function reconcileLayout(
    savedLayout: WidgetConfig[],
    trackers: Tracker[],
): WidgetConfig[] {
    // 1. Hydrate saved tracker widgets with fresh data
    let working = hydrateTrackers(savedLayout, trackers);

    // 2. Inject missing system widgets (e.g. newly added defaults like Chess)
    const defaults = buildDefaultLayout(trackers);
    const currentIds = new Set(working.map((w) => w.id));
    const missingDefaults = defaults.filter((w) => !currentIds.has(w.id));
    if (missingDefaults.length > 0) working = [...working, ...missingDefaults];

    // 3. Remove recovery-empty placeholder if real trackers now exist
    if (trackers.length > 0) {
        working = working.filter((w) => w.type !== 'recovery-empty');
    }

    // 4. Append any newly created trackers not yet in the layout
    const existingTrackerIds = new Set(
        working
            .filter((w) => w.type === 'recovery')
            .map((w) => w.id.replace('widget-recovery-', '')),
    );
    const newTrackers = trackers.filter((t) => !existingTrackerIds.has(t.id));
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
