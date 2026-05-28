import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
import type { FitnessAnalytics } from '@/features/tracking/types/fitnessAnalytics';
import type { WorkoutSession } from '@/features/tracking/types/fitness';
import { normalizeWorkoutEntries } from './normalize';
import { detectPersonalRecords } from './progression';

function startOfWeek(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    const day = copy.getDay();
    copy.setDate(copy.getDate() - day);
    return copy;
}

function inRange(date: string, start: Date, end: Date): boolean {
    const value = new Date(`${date}T00:00:00`);
    return value >= start && value <= end;
}

export function getWeeklySessions(
    sessions: WorkoutSession[],
    reference = new Date(),
): WorkoutSession[] {
    const start = startOfWeek(reference);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return sessions.filter((session) => inRange(session.date, start, end));
}

export function getPreviousWeeklySessions(
    sessions: WorkoutSession[],
    reference = new Date(),
): WorkoutSession[] {
    const end = startOfWeek(reference);
    const start = new Date(end);
    start.setDate(end.getDate() - 7);
    return sessions.filter((session) => inRange(session.date, start, end));
}

function sum(
    sessions: WorkoutSession[],
    selector: (session: WorkoutSession) => number | undefined,
): number {
    return sessions.reduce(
        (total, session) => total + (selector(session) ?? 0),
        0,
    );
}

export function calculateMuscleGroupFrequency(
    sessions: WorkoutSession[],
): Record<string, number> {
    const result: Record<string, number> = {};
    for (const session of sessions) {
        const trained = new Set<string>();
        for (const exercise of session.exercises) {
            for (const muscle of exercise.muscleGroups)
                trained.add(muscle.toLowerCase());
        }
        for (const muscle of trained)
            result[muscle] = (result[muscle] ?? 0) + 1;
    }
    return result;
}

export function buildFitnessInsights(
    analytics: Omit<FitnessAnalytics, 'insights'>,
): string[] {
    const insights: string[] = [];
    if (analytics.sessions.length === 0)
        return ['Not enough data for insights yet.'];
    insights.push(
        `You trained ${analytics.weeklyWorkoutCount} time${analytics.weeklyWorkoutCount === 1 ? '' : 's'} this week.`,
    );
    if (analytics.previousWeeklyVolume > 0 && analytics.weeklyVolume > 0) {
        const delta = Math.round(
            ((analytics.weeklyVolume - analytics.previousWeeklyVolume) /
                analytics.previousWeeklyVolume) *
                100,
        );
        insights.push(
            `Your volume is ${delta >= 0 ? 'up' : 'down'} ${Math.abs(delta)}% from last week.`,
        );
    }
    const recentPr = analytics.recentPrs[0];
    if (recentPr) insights.push(`You hit a new ${recentPr.exerciseName} PR.`);
    const latest = analytics.latestWorkout;
    if (latest && latest.durationMinutes > 0) {
        const avg = Math.round(
            sum(analytics.sessions, (session) => session.durationMinutes) /
                analytics.sessions.length,
        );
        insights.push(`Your average workout duration is ${avg} minutes.`);
    }
    const legsCount =
        analytics.muscleGroupFrequency['legs'] ??
        analytics.muscleGroupFrequency['quads'] ??
        analytics.muscleGroupFrequency['hamstrings'] ??
        0;
    if (analytics.sessions.length >= 3 && legsCount === 0)
        insights.push('You have not trained legs recently.');
    return insights.slice(0, 5);
}

export function computeFitnessAnalytics(
    entries: TrackingEntry[],
    reference = new Date(),
): FitnessAnalytics {
    const sessions = normalizeWorkoutEntries(entries);
    const weekly = getWeeklySessions(sessions, reference);
    const previousWeekly = getPreviousWeeklySessions(sessions, reference);
    const prs = detectPersonalRecords(sessions);
    const recentPrs = prs.filter((pr) => {
        const date = new Date(`${pr.date}T00:00:00`);
        const cutoff = new Date(reference);
        cutoff.setDate(cutoff.getDate() - 30);
        return date >= cutoff;
    });
    const base = {
        sessions,
        latestWorkout: sessions[0] ?? null,
        weeklyWorkoutCount: weekly.length,
        weeklyDuration: sum(weekly, (session) => session.durationMinutes),
        weeklyVolume: sum(weekly, (session) => session.totalVolume),
        weeklyDistance: sum(weekly, (session) => session.distance),
        previousWeeklyVolume: sum(
            previousWeekly,
            (session) => session.totalVolume,
        ),
        totalVolume: sum(sessions, (session) => session.totalVolume),
        totalSets: sum(sessions, (session) => session.totalSets),
        totalReps: sum(sessions, (session) => session.totalReps),
        prs,
        recentPrs,
        muscleGroupFrequency: calculateMuscleGroupFrequency(sessions),
    };
    return { ...base, insights: buildFitnessInsights(base) };
}
