import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
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
