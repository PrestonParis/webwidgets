import type {
    TrackingEntry,
    TrackingCategory,
} from '@/features/tracking/types/tracking';
import type {
    TrackingStats,
    DataPoint,
    Trend,
} from '@/features/tracking/types/analytics';
import type {
    TrackingGoal,
    GoalProgress,
} from '@/features/tracking/types/goals';

function toDateKey(date: Date): string {
    return date.toISOString().slice(0, 10);
}

function todayKey(): string {
    return toDateKey(new Date());
}

export function filterByCategory(
    entries: TrackingEntry[],
    category: TrackingCategory,
): TrackingEntry[] {
    return entries.filter((e) => e.category === category);
}

export function groupByDate(
    entries: TrackingEntry[],
): Map<string, TrackingEntry[]> {
    const map = new Map<string, TrackingEntry[]>();
    for (const e of entries) {
        const list = map.get(e.entryDate) ?? [];
        list.push(e);
        map.set(e.entryDate, list);
    }
    return map;
}

export function calcCurrentStreak(
    entries: TrackingEntry[],
    category: TrackingCategory,
): number {
    const filtered = filterByCategory(entries, category);
    const dates = new Set(filtered.map((e) => e.entryDate));
    const today = todayKey();
    const cursor = new Date();

    if (!dates.has(today)) {
        cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (dates.has(toDateKey(cursor))) {
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

export function calcLongestStreak(
    entries: TrackingEntry[],
    category: TrackingCategory,
): number {
    const filtered = filterByCategory(entries, category);
    if (filtered.length === 0) return 0;

    const sorted = [...new Set(filtered.map((e) => e.entryDate))].sort();
    let longest = 1;
    let current = 1;

    for (let i = 1; i < sorted.length; i++) {
        const prevStr = sorted[i - 1] ?? '';
        const currStr = sorted[i] ?? '';
        const prev = new Date(prevStr + 'T00:00:00Z');
        const curr = new Date(currStr + 'T00:00:00Z');
        const diffDays = Math.round(
            (curr.getTime() - prev.getTime()) / 86400000,
        );
        if (diffDays === 1) {
            current++;
            if (current > longest) longest = current;
        } else {
            current = 1;
        }
    }
    return longest;
}

export function calcRollingAverage(
    series: DataPoint[],
    window: number,
): DataPoint[] {
    return series.map((point, i) => {
        const slice = series.slice(Math.max(0, i - window + 1), i + 1);
        const avg = slice.reduce((sum, p) => sum + p.value, 0) / slice.length;
        return { date: point.date, value: avg };
    });
}

export function calcTrend(
    series: DataPoint[],
    period: 'week' | 'month',
): Trend {
    const n = period === 'week' ? 7 : 30;
    const recent = series.slice(-n);
    const prior = series.slice(-n * 2, -n);

    const avg = (pts: DataPoint[]) =>
        pts.length === 0
            ? 0
            : pts.reduce((s, p) => s + p.value, 0) / pts.length;

    const recentAvg = avg(recent);
    const priorAvg = avg(prior);
    const diff = recentAvg - priorAvg;
    const magnitude =
        priorAvg === 0 ? 0 : Math.min(1, Math.abs(diff / priorAvg));

    const direction =
        Math.abs(diff) < 0.01 * (priorAvg || 1)
            ? 'stable'
            : diff > 0
              ? 'improving'
              : 'declining';

    return { direction, magnitude, period, metric: '' };
}

export function extractMetricSeries(
    entries: TrackingEntry[],
    category: TrackingCategory,
    metric: string,
): DataPoint[] {
    return filterByCategory(entries, category)
        .filter((e) => typeof e.metadata[metric] === 'number')
        .map((e) => ({
            date: e.entryDate,
            value: e.metadata[metric] as number,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
}

function isoWeekKey(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00Z');
    const day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil(
        ((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
    );
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function isGoalMetOnDate(
    entries: TrackingEntry[],
    goal: TrackingGoal,
    date: string,
): boolean {
    const dayEntries = entries.filter(
        (e) => e.category === goal.category && e.entryDate === date,
    );
    if (goal.targetType === 'daily_log') return dayEntries.length > 0;
    if (goal.targetType === 'daily_min') {
        return dayEntries.some((e) => {
            const v = goal.metricKey ? e.metadata[goal.metricKey] : undefined;
            return typeof v === 'number' && v >= goal.targetValue;
        });
    }
    if (goal.targetType === 'weekly_count') {
        const week = isoWeekKey(date);
        const count = entries.filter(
            (e) =>
                e.category === goal.category &&
                isoWeekKey(e.entryDate) === week,
        ).length;
        return count >= goal.targetValue;
    }
    return false;
}

export function calcGoalCurrentStreak(
    entries: TrackingEntry[],
    goal: TrackingGoal,
): number {
    if (goal.targetType === 'weekly_count') {
        const weeks = [
            ...new Set(
                entries
                    .filter((e) => e.category === goal.category)
                    .map((e) => isoWeekKey(e.entryDate)),
            ),
        ]
            .sort()
            .reverse();
        const currentWeek = isoWeekKey(todayKey());
        let streak = 0;
        for (const week of weeks) {
            if (streak === 0 && week !== currentWeek) {
                const prevWeek = isoWeekKey(
                    toDateKey(new Date(Date.now() - 7 * 86400000)),
                );
                if (week !== prevWeek) break;
            }
            const count = entries.filter(
                (e) =>
                    e.category === goal.category &&
                    isoWeekKey(e.entryDate) === week,
            ).length;
            if (count >= goal.targetValue) streak++;
            else break;
        }
        return streak;
    }

    const cursor = new Date();
    const today = todayKey();
    if (!isGoalMetOnDate(entries, goal, today))
        cursor.setDate(cursor.getDate() - 1);

    let streak = 0;
    for (let i = 0; i < 365; i++) {
        const dateStr = toDateKey(cursor);
        if (!isGoalMetOnDate(entries, goal, dateStr)) break;
        streak++;
        cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
}

export function calcGoalLongestStreak(
    entries: TrackingEntry[],
    goal: TrackingGoal,
): number {
    if (goal.targetType === 'weekly_count') {
        const weeks = [
            ...new Set(
                entries
                    .filter((e) => e.category === goal.category)
                    .map((e) => isoWeekKey(e.entryDate)),
            ),
        ].sort();
        let longest = 0;
        let current = 0;
        for (const week of weeks) {
            const count = entries.filter(
                (e) =>
                    e.category === goal.category &&
                    isoWeekKey(e.entryDate) === week,
            ).length;
            if (count >= goal.targetValue) {
                current++;
                if (current > longest) longest = current;
            } else current = 0;
        }
        return longest;
    }

    const dates = [
        ...new Set(
            entries
                .filter((e) => e.category === goal.category)
                .map((e) => e.entryDate),
        ),
    ].sort();
    let longest = 0;
    let current = 0;
    for (const date of dates) {
        if (isGoalMetOnDate(entries, goal, date)) {
            current++;
            if (current > longest) longest = current;
        } else current = 0;
    }
    return longest;
}

export function calcGoalProgress(
    entries: TrackingEntry[],
    goal: TrackingGoal,
): GoalProgress {
    const today = todayKey();
    const currentStreak = calcGoalCurrentStreak(entries, goal);
    const longestStreak = calcGoalLongestStreak(entries, goal);
    const todayMet = isGoalMetOnDate(entries, goal, today);

    if (goal.targetType === 'weekly_count') {
        const week = isoWeekKey(today);
        const count = entries.filter(
            (e) =>
                e.category === goal.category &&
                isoWeekKey(e.entryDate) === week,
        ).length;
        return {
            today: todayMet,
            currentStreak,
            longestStreak,
            weekProgress: { count, target: goal.targetValue },
        };
    }

    return { today: todayMet, currentStreak, longestStreak };
}

export function calcCategoryStats(
    entries: TrackingEntry[],
    category: TrackingCategory,
): TrackingStats {
    const filtered = filterByCategory(entries, category);
    const today = todayKey();
    const weekAgo = toDateKey(new Date(Date.now() - 7 * 86400000));
    const monthAgo = toDateKey(new Date(Date.now() - 30 * 86400000));

    return {
        category,
        count: filtered.length,
        currentStreak: calcCurrentStreak(entries, category),
        longestStreak: calcLongestStreak(entries, category),
        weeklyCount: filtered.filter(
            (e) => e.entryDate >= weekAgo && e.entryDate <= today,
        ).length,
        monthlyCount: filtered.filter(
            (e) => e.entryDate >= monthAgo && e.entryDate <= today,
        ).length,
    };
}
