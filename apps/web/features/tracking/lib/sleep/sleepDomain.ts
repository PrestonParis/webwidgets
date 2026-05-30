import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
import type { TrackingGoal } from '@/features/tracking/types/goals';
import { calculateSleepDuration } from '@/features/tracking/lib/trackingUtils';

// ─── domain types ─────────────────────────────────────────────────────────────

export interface SleepRecord {
    id: string;
    date: string; // YYYY-MM-DD
    durationHours: number | null;
    bedtime: string | null; // HH:mm
    wakeTime: string | null; // HH:mm
    quality: number | null; // 1-10
    notes: string | null;
    source: string;
    raw: TrackingEntry;
}

export type SleepViewMode = 'summary' | 'heatmap' | 'trends' | 'history';

export interface SleepAnalytics {
    lastRecord: SleepRecord | null;
    sevenDayAvg: number | null;
    thirtyDayAvg: number | null;
    goalHitRate7d: number | null; // 0-1, null if no goal
    goalHitRate30d: number | null;
    trend: 'up' | 'down' | 'stable' | null;
    totalRecords: number;
}

// ─── normalization ─────────────────────────────────────────────────────────────

export function normalizeSleepEntry(entry: TrackingEntry): SleepRecord {
    const m = entry.metadata;
    const bedtime = typeof m['bedtime'] === 'string' ? m['bedtime'] : null;
    const wakeTime = typeof m['wakeTime'] === 'string' ? m['wakeTime'] : null;
    const quality = typeof m['quality'] === 'number' ? m['quality'] : null;

    let durationHours: number | null = null;
    if (typeof m['durationHours'] === 'number') {
        durationHours = m['durationHours'];
    } else if (bedtime && wakeTime) {
        const d = calculateSleepDuration(bedtime, wakeTime);
        if (d) durationHours = Math.round((d.hours + d.minutes / 60) * 10) / 10;
    }

    return {
        id: entry.id,
        date: entry.entryDate,
        durationHours,
        bedtime,
        wakeTime,
        quality,
        notes: entry.notes ?? null,
        source: entry.source,
        raw: entry,
    };
}

/** Returns sleep records sorted newest-first. */
export function normalizeSleepEntries(entries: TrackingEntry[]): SleepRecord[] {
    return entries
        .filter((e) => e.category === 'sleep')
        .map(normalizeSleepEntry)
        .sort((a, b) => b.date.localeCompare(a.date));
}

// ─── analytics ────────────────────────────────────────────────────────────────

function dayKey(offsetDays = 0): string {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().slice(0, 10);
}

function avgDuration(records: SleepRecord[]): number | null {
    const withDur = records.filter((r) => r.durationHours !== null);
    if (withDur.length === 0) return null;
    return withDur.reduce((s, r) => s + r.durationHours!, 0) / withDur.length;
}

export function computeSleepAnalytics(
    records: SleepRecord[],
    goal: TrackingGoal | null,
): SleepAnalytics {
    const today = dayKey(0);
    const sevenAgo = dayKey(-7);
    const thirtyAgo = dayKey(-30);
    const fourteenAgo = dayKey(-14);

    const last7 = records.filter((r) => r.date >= sevenAgo && r.date <= today);
    const last30 = records.filter(
        (r) => r.date >= thirtyAgo && r.date <= today,
    );
    const prior7 = records.filter(
        (r) => r.date >= fourteenAgo && r.date < sevenAgo,
    );

    const minHours = goal?.targetType === 'daily_min' ? goal.targetValue : null;

    const hitRate = (rs: SleepRecord[]): number | null => {
        if (!minHours) return null;
        const withDur = rs.filter((r) => r.durationHours !== null);
        if (withDur.length === 0) return null;
        return (
            withDur.filter((r) => r.durationHours! >= minHours).length /
            withDur.length
        );
    };

    const trend = ((): 'up' | 'down' | 'stable' | null => {
        const curr = avgDuration(last7);
        const prev = avgDuration(prior7);
        if (curr === null || prev === null) return null;
        if (curr - prev > 0.25) return 'up';
        if (prev - curr > 0.25) return 'down';
        return 'stable';
    })();

    return {
        lastRecord: records[0] ?? null,
        sevenDayAvg: avgDuration(last7),
        thirtyDayAvg: avgDuration(last30),
        goalHitRate7d: hitRate(last7),
        goalHitRate30d: hitRate(last30),
        trend,
        totalRecords: records.length,
    };
}

// ─── heatmap helpers ───────────────────────────────────────────────────────────

/**
 * How many weeks to show so the oldest record is visible, capped at maxWeeks.
 * Falls back to maxWeeks when there are no records.
 */
export function heatmapWeeks(records: SleepRecord[], maxWeeks = 16): number {
    if (records.length === 0) return maxWeeks;
    const oldest = records[records.length - 1]?.date;
    if (!oldest) return maxWeeks;
    const diffDays = Math.ceil(
        (Date.now() - new Date(oldest + 'T00:00:00Z').getTime()) / 86400000,
    );
    return Math.min(maxWeeks, Math.max(2, Math.ceil(diffDays / 7) + 1));
}

/** Maps sleep duration (hours) to a Tailwind-compatible hex color. */
export function sleepDurationColorFn(v: number): string {
    if (v === 0) return '#f4f4f5'; // no entry
    if (v < 5) return '#fca5a5'; // < 5h  – red
    if (v < 6) return '#fdba74'; // 5–6h  – orange
    if (v < 7) return '#fde68a'; // 6–7h  – yellow
    if (v < 8) return '#86efac'; // 7–8h  – light green
    if (v < 9) return '#4ade80'; // 8–9h  – green
    return '#22c55e'; // 9h+   – dark green
}

/** Converts normalized sleep records to the shape expected by <Heatmap>. */
export function toHeatmapData(
    records: SleepRecord[],
): Array<{ date: string; value: number }> {
    return records.map((r) => ({
        date: r.date,
        value: r.durationHours ?? 1, // use duration if available, else presence marker
    }));
}

// ─── formatting ────────────────────────────────────────────────────────────────

export function formatDuration(hours: number): string {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
}

export function formatDurationShort(hours: number): string {
    return `${Math.floor(hours)}h${Math.round((hours % 1) * 60)
        .toString()
        .padStart(2, '0')}`;
}

export function sleepQualityLabel(quality: number): string {
    if (quality <= 2) return 'Very Poor';
    if (quality <= 4) return 'Poor';
    if (quality <= 6) return 'Fair';
    if (quality <= 8) return 'Good';
    return 'Excellent';
}

export function sleepRecordSummary(record: SleepRecord): string {
    const parts: string[] = [];
    if (record.durationHours !== null)
        parts.push(formatDuration(record.durationHours));
    if (record.bedtime && record.wakeTime)
        parts.push(`${record.bedtime} → ${record.wakeTime}`);
    else if (record.bedtime) parts.push(`bed ${record.bedtime}`);
    else if (record.wakeTime) parts.push(`up ${record.wakeTime}`);
    if (record.quality !== null) parts.push(`Q${record.quality}/10`);
    return parts.length > 0 ? parts.join(' · ') : 'N/A';
}

export function goalMetToday(
    records: SleepRecord[],
    goal: TrackingGoal | null,
): boolean | null {
    if (!goal || goal.targetType !== 'daily_min') return null;
    const today = dayKey(0);
    const yesterday = dayKey(-1);
    // Sleep logged "today" or "yesterday" (night of) counts
    const recent = records.find(
        (r) => r.date === today || r.date === yesterday,
    );
    if (!recent || recent.durationHours === null) return false;
    return recent.durationHours >= goal.targetValue;
}
