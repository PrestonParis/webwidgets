interface LogEntry {
    date: string;
    value?: number | undefined;
    [key: string]: unknown;
}

export function calculateStreak(
    entries: LogEntry[],
    dateField = 'date',
): number {
    if (entries.length === 0) return 0;
    const dates = [
        ...new Set(entries.map((e) => String(e[dateField]).slice(0, 10))),
    ]
        .sort()
        .reverse();
    let streak = 0;
    let expected = new Date();
    expected.setHours(0, 0, 0, 0);
    for (const dateStr of dates) {
        const d = new Date(dateStr);
        const diff = Math.round((expected.getTime() - d.getTime()) / 86400000);
        if (diff > 1) break;
        streak++;
        expected = new Date(d);
        expected.setDate(expected.getDate() - 1);
    }
    return streak;
}

export function calculateRollingAverage(
    entries: LogEntry[],
    valueField = 'value',
    windowDays = 7,
): number | null {
    if (entries.length === 0) return null;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const recent = entries.filter(
        (e) => String(e.date).slice(0, 10) >= cutoffStr,
    );
    if (recent.length === 0) return null;
    const vals = recent
        .map((e) => Number(e[valueField]))
        .filter((n) => !isNaN(n));
    if (vals.length === 0) return null;
    return vals.reduce((s, v) => s + v, 0) / vals.length;
}

export function calculateMetricTrend(
    entries: LogEntry[],
    valueField = 'value',
    windowDays = 30,
): 'improving' | 'declining' | 'stable' {
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    const half = Math.floor(sorted.length / 2);
    if (sorted.length < 4) return 'stable';
    const avgFirst =
        sorted
            .slice(0, half)
            .reduce((s, e) => s + Number(e[valueField] ?? 0), 0) / half;
    const avgLast =
        sorted.slice(half).reduce((s, e) => s + Number(e[valueField] ?? 0), 0) /
        (sorted.length - half);
    const delta = avgLast - avgFirst;
    const threshold = Math.abs(avgFirst) * 0.05;
    if (delta > threshold) return 'improving';
    if (delta < -threshold) return 'declining';
    return 'stable';
}

export function detectAnomalies(
    entries: LogEntry[],
    valueField = 'value',
    sensitivitySigma = 2,
): LogEntry[] {
    const vals = entries
        .map((e) => Number(e[valueField]))
        .filter((n) => !isNaN(n));
    if (vals.length < 4) return [];
    const mean = vals.reduce((s, v) => s + v, 0) / vals.length;
    const variance =
        vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
    const sigma = Math.sqrt(variance);
    const threshold = sensitivitySigma * sigma;
    return entries.filter(
        (e) => Math.abs(Number(e[valueField]) - mean) > threshold,
    );
}

export function calculateCorrelation(
    xEntries: LogEntry[],
    yEntries: LogEntry[],
    xField = 'value',
    yField = 'value',
): number | null {
    const byDate = new Map<string, { x: number; y: number }>();
    for (const e of xEntries) {
        if (e.date && e[xField] !== undefined)
            byDate.set(e.date.slice(0, 10), { x: Number(e[xField]), y: 0 });
    }
    for (const e of yEntries) {
        const k = e.date.slice(0, 10);
        const entry = byDate.get(k);
        if (entry && e[yField] !== undefined) entry.y = Number(e[yField]);
    }
    const pairs = [...byDate.values()].filter(
        (p) => !isNaN(p.x) && !isNaN(p.y),
    );
    if (pairs.length < 3) return null;
    const n = pairs.length;
    const mx = pairs.reduce((s, p) => s + p.x, 0) / n;
    const my = pairs.reduce((s, p) => s + p.y, 0) / n;
    const num = pairs.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0);
    const den = Math.sqrt(
        pairs.reduce((s, p) => s + (p.x - mx) ** 2, 0) *
            pairs.reduce((s, p) => s + (p.y - my) ** 2, 0),
    );
    return den === 0 ? null : num / den;
}

export function detectMissingLogs(
    entries: LogEntry[],
    expectedDays = 7,
): string[] {
    const logged = new Set(entries.map((e) => String(e.date).slice(0, 10)));
    const missing: string[] = [];
    for (let i = 1; i <= expectedDays; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        if (!logged.has(key)) missing.push(key);
    }
    return missing;
}

export function summarizeHabits(
    entries: LogEntry[],
    windowDays = 30,
): { total: number; uniqueDays: number; completionRate: number } {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - windowDays);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const recent = entries.filter(
        (e) => String(e.date).slice(0, 10) >= cutoffStr,
    );
    const uniqueDays = new Set(recent.map((e) => String(e.date).slice(0, 10)))
        .size;
    return {
        total: recent.length,
        uniqueDays,
        completionRate: uniqueDays / windowDays,
    };
}
