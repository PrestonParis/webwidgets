import { describe, it, expect } from 'vitest';
import {
    buildDefaultLayout,
    hydrateTrackers,
    makePersistKey,
    makePersistTimestampKey,
    reconcileLayout,
} from '@/features/dashboard/lib/dashboardLayout';
import type { WidgetConfig } from '@/features/dashboard/types/dashboard';
import type { Tracker } from '@/features/recovery/types/recovery';

function makeTracker(id: string): Tracker {
    return {
        id,
        addiction: 'alcohol',
        start_time: '2026-01-01T00:00:00Z',
        created_at: '2026-01-01T00:00:00Z',
    };
}

function makeRecoveryWidget(trackerId: string): WidgetConfig {
    return {
        id: `widget-recovery-${trackerId}`,
        type: 'recovery',
        visible: true,
        columnSpan: 1,
        containerId: 'main',
        order: 0,
        props: { tracker: makeTracker('old-data') },
    };
}

describe('hydrateTrackers', () => {
    it('replaces tracker props with fresh data', () => {
        const fresh = makeTracker('abc');
        const layout: WidgetConfig[] = [makeRecoveryWidget('abc')];
        const result = hydrateTrackers(layout, [fresh]);
        expect(result[0]?.props?.tracker).toEqual(fresh);
    });

    it('converts to recovery-empty when tracker is not found', () => {
        const layout: WidgetConfig[] = [makeRecoveryWidget('abc')];
        const result = hydrateTrackers(layout, []);
        expect(result[0]?.type).toBe('recovery-empty');
        expect(result[0]?.props).toEqual({});
    });

    it('leaves non-recovery widgets untouched', () => {
        const journalWidget: WidgetConfig = {
            id: 'widget-journal',
            type: 'texteditor',
            visible: true,
            columnSpan: 1,
            containerId: 'main',
            order: 0,
        };
        const result = hydrateTrackers([journalWidget], [makeTracker('x')]);
        expect(result[0]).toEqual(journalWidget);
    });

    it('handles an empty layout', () => {
        expect(hydrateTrackers([], [makeTracker('x')])).toEqual([]);
    });

    it('hydrates multiple recovery widgets independently', () => {
        const t1 = makeTracker('t1');
        const t2 = makeTracker('t2');
        const layout: WidgetConfig[] = [
            makeRecoveryWidget('t1'),
            makeRecoveryWidget('t2'),
        ];
        const result = hydrateTrackers(layout, [t1, t2]);
        expect(result[0]?.props?.tracker?.id).toBe('t1');
        expect(result[1]?.props?.tracker?.id).toBe('t2');
    });
});

describe('V1 default layout', () => {
    it('does not seed suspended beta widgets', () => {
        const widgetTypes = buildDefaultLayout([]).map((widget) => widget.type);

        expect(widgetTypes).not.toContain('chess');
        expect(widgetTypes).not.toContain('creative');
        expect(widgetTypes).not.toContain('memorization');
        expect(widgetTypes).not.toContain('reading');
        expect(widgetTypes).toContain('news');
    });

    it('preserves suspended widgets already owned by the user', () => {
        const existing: WidgetConfig = {
            id: 'widget-creative-existing',
            type: 'creative',
            visible: true,
            columnSpan: 2,
            containerId: 'main',
            order: 4,
        };

        const result = reconcileLayout([existing], [], true);

        expect(result).toEqual([existing]);
    });

    it('treats a saved layout as authoritative without injecting defaults', () => {
        const selected: WidgetConfig = {
            id: 'widget-todo',
            type: 'todo',
            visible: true,
            columnSpan: 1,
            containerId: 'main',
            order: 0,
        };

        expect(reconcileLayout([selected], [], false)).toEqual([selected]);
    });
});

describe('makePersistKey', () => {
    it('includes the userId', () => {
        expect(makePersistKey('user-123')).toContain('user-123');
    });

    it('produces different keys for different users', () => {
        expect(makePersistKey('a')).not.toBe(makePersistKey('b'));
    });
});

describe('makePersistTimestampKey', () => {
    it('differs from the layout key for the same user', () => {
        expect(makePersistTimestampKey('u')).not.toBe(makePersistKey('u'));
    });

    it('includes the userId', () => {
        expect(makePersistTimestampKey('user-456')).toContain('user-456');
    });
});
