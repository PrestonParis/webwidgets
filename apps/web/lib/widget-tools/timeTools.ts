export type TimeUnit = 'day' | 'week' | 'month' | 'year';
export type AggregationFn = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface TimeBucket {
    label: string;
    start: string;
    end: string;
    items: Record<string, unknown>[];
}

export function groupByTime(
    rows: Record<string, unknown>[],
    dateField: string,
    unit: TimeUnit,
): Record<string, Record<string, unknown>[]> {
    const groups: Record<string, Record<string, unknown>[]> = {};
    for (const row of rows) {
        const raw = row[dateField];
        if (!raw) continue;
        const d = new Date(String(raw));
        if (isNaN(d.getTime())) continue;
        const key = getBucketKey(d, unit);
        (groups[key] ??= []).push(row);
    }
    return groups;
}

function getBucketKey(d: Date, unit: TimeUnit): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    if (unit === 'day') return `${y}-${m}-${day}`;
    if (unit === 'week') {
        const monday = new Date(d);
        monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
        return monday.toISOString().slice(0, 10);
    }
    if (unit === 'month') return `${y}-${m}`;
    return String(y);
}

export function comparePeriods(
    rows: Record<string, unknown>[],
    dateField: string,
    valueField: string,
    unit: TimeUnit,
): {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
} {
    const now = new Date();
    const currentKey = getBucketKey(now, unit);
    const prev = new Date(now);
    if (unit === 'day') prev.setDate(prev.getDate() - 1);
    else if (unit === 'week') prev.setDate(prev.getDate() - 7);
    else if (unit === 'month') prev.setMonth(prev.getMonth() - 1);
    else prev.setFullYear(prev.getFullYear() - 1);
    const prevKey = getBucketKey(prev, unit);
    const grouped = groupByTime(rows, dateField, unit);
    const sumFor = (key: string) =>
        (grouped[key] ?? []).reduce(
            (s, r) => s + Number(r[valueField] ?? 0),
            0,
        );
    const current = sumFor(currentKey);
    const previous = sumFor(prevKey);
    const change = current - previous;
    const changePercent =
        previous !== 0 ? (change / Math.abs(previous)) * 100 : 0;
    return { current, previous, change, changePercent };
}

export function generateDateBuckets(n: number, unit: TimeUnit): TimeBucket[] {
    const buckets: TimeBucket[] = [];
    const now = new Date();
    for (let i = n - 1; i >= 0; i--) {
        const start = new Date(now);
        if (unit === 'day') start.setDate(start.getDate() - i);
        else if (unit === 'week') start.setDate(start.getDate() - i * 7);
        else if (unit === 'month') start.setMonth(start.getMonth() - i);
        else start.setFullYear(start.getFullYear() - i);
        const end = new Date(start);
        if (unit === 'day') end.setDate(end.getDate() + 1);
        else if (unit === 'week') end.setDate(end.getDate() + 7);
        else if (unit === 'month') end.setMonth(end.getMonth() + 1);
        else end.setFullYear(end.getFullYear() + 1);
        const key = getBucketKey(start, unit);
        buckets.push({
            label: key,
            start: start.toISOString().slice(0, 10),
            end: end.toISOString().slice(0, 10),
            items: [],
        });
    }
    return buckets;
}

export function calculateTimeUntilEvent(targetDate: string): {
    days: number;
    hours: number;
    past: boolean;
} {
    const target = new Date(targetDate);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();
    const past = diffMs < 0;
    const absDiff = Math.abs(diffMs);
    const days = Math.floor(absDiff / 86400000);
    const hours = Math.floor((absDiff % 86400000) / 3600000);
    return { days, hours, past };
}

export function detectRecurringPattern(
    dates: string[],
): { interval: number; unit: TimeUnit } | null {
    if (dates.length < 3) return null;
    const sorted = [...dates].sort();
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
        const a = new Date(sorted[i - 1] ?? '');
        const b = new Date(sorted[i] ?? '');
        if (isNaN(a.getTime()) || isNaN(b.getTime())) continue;
        gaps.push(Math.round((b.getTime() - a.getTime()) / 86400000));
    }
    if (gaps.length === 0) return null;
    const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    if (avg <= 1.5) return { interval: 1, unit: 'day' };
    if (avg <= 8) return { interval: 1, unit: 'week' };
    if (avg <= 35) return { interval: 1, unit: 'month' };
    return { interval: 1, unit: 'year' };
}

export function aggregateByTime(
    rows: Record<string, unknown>[],
    dateField: string,
    valueField: string,
    unit: TimeUnit,
    fn: AggregationFn,
): Array<{ label: string; value: number }> {
    const groups = groupByTime(rows, dateField, unit);
    return Object.entries(groups)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, items]) => {
            const vals = items
                .map((r) => Number(r[valueField] ?? 0))
                .filter((n) => !isNaN(n));
            let value = 0;
            if (fn === 'sum') value = vals.reduce((s, v) => s + v, 0);
            else if (fn === 'avg')
                value =
                    vals.length > 0
                        ? vals.reduce((s, v) => s + v, 0) / vals.length
                        : 0;
            else if (fn === 'count') value = vals.length;
            else if (fn === 'min') value = Math.min(...vals);
            else if (fn === 'max') value = Math.max(...vals);
            return { label, value };
        });
}
