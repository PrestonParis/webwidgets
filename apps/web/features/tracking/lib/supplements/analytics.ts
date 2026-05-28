import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';
import type { Supplement as StoredSupplement } from '@/features/tracking/types/supplement';
import type {
    DueDose,
    SupplementLog,
} from '@/features/tracking/types/supplementLogs';
import type { SupplementAnalytics } from '@/features/tracking/types/supplementAnalytics';
import type { SupplementDefinition } from '@/features/tracking/types/supplementDefinitions';
import type { TimeOfDayGroup } from '@/features/tracking/types/supplementBase';
import {
    normalizeSupplementDefinitions,
    normalizeSupplementLogs,
} from './normalize';
import { calculateDueDoses, calculateNextDose } from './schedule';

function daysAgo(days: number, reference: Date): string {
    const copy = new Date(reference);
    copy.setDate(copy.getDate() - days);
    return copy.toISOString().slice(0, 10);
}

function adherence(
    logs: SupplementLog[],
    days: number,
    reference: Date,
): number {
    const cutoff = daysAgo(days - 1, reference);
    const recent = logs.filter(
        (log) =>
            log.date >= cutoff &&
            ['taken', 'skipped', 'missed'].includes(log.status),
    );
    if (recent.length === 0) return 0;
    return (
        recent.filter((log) => log.status === 'taken').length / recent.length
    );
}

function adherenceBySupplement(logs: SupplementLog[]): Record<string, number> {
    const grouped = new Map<string, SupplementLog[]>();
    for (const log of logs)
        grouped.set(log.name, [...(grouped.get(log.name) ?? []), log]);
    return Object.fromEntries(
        [...grouped.entries()].map(([name, group]) => [
            name,
            group.length === 0
                ? 0
                : group.filter((log) => log.status === 'taken').length /
                  group.length,
        ]),
    );
}

function correlation(xs: number[], ys: number[]): number | null {
    if (xs.length < 3 || xs.length !== ys.length) return null;
    const avgX = xs.reduce((sum, value) => sum + value, 0) / xs.length;
    const avgY = ys.reduce((sum, value) => sum + value, 0) / ys.length;
    const numerator = xs.reduce(
        (sum, value, index) => sum + (value - avgX) * (ys[index]! - avgY),
        0,
    );
    const denomX = Math.sqrt(
        xs.reduce((sum, value) => sum + (value - avgX) ** 2, 0),
    );
    const denomY = Math.sqrt(
        ys.reduce((sum, value) => sum + (value - avgY) ** 2, 0),
    );
    if (denomX === 0 || denomY === 0) return null;
    return Math.round((numerator / (denomX * denomY)) * 100) / 100;
}

function sideEffectFrequency(logs: SupplementLog[]): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const log of logs) {
        for (const sideEffect of log.sideEffects) {
            counts[sideEffect.name] = (counts[sideEffect.name] ?? 0) + 1;
        }
    }
    return counts;
}

function mostMissedTime(doses: DueDose[]): TimeOfDayGroup | null {
    const counts: Partial<Record<TimeOfDayGroup, number>> = {};
    for (const dose of doses) {
        if (dose.status === 'missed')
            counts[dose.group] = (counts[dose.group] ?? 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return (sorted[0]?.[0] as TimeOfDayGroup | undefined) ?? null;
}

function costPerDay(definitions: SupplementDefinition[]): number {
    return definitions.reduce((sum, definition) => {
        if (
            !definition.inventory?.cost ||
            definition.inventory.dosesRemaining <= 0
        )
            return sum;
        return (
            sum +
            definition.inventory.cost / definition.inventory.dosesRemaining
        );
    }, 0);
}

export function computeSupplementAnalytics(
    stored: StoredSupplement[],
    entries: TrackingEntry[],
    reference = new Date(),
): SupplementAnalytics {
    const logs = normalizeSupplementLogs(entries);
    const definitions = normalizeSupplementDefinitions(stored, entries);
    const dueToday = calculateDueDoses(definitions, logs, reference);
    const today = reference.toISOString().slice(0, 10);
    const missedCount =
        logs.filter((log) => log.status === 'missed').length +
        dueToday.filter((dose) => dose.status === 'missed').length;
    const skipped = logs.filter((log) => log.status === 'skipped');
    const skippedReasonBreakdown: Record<string, number> = {};
    for (const log of skipped) {
        const reason = log.skipReason ?? 'No reason';
        skippedReasonBreakdown[reason] =
            (skippedReasonBreakdown[reason] ?? 0) + 1;
    }
    const effectivenessTrend = logs
        .filter((log) => log.effectiveness)
        .map((log) => log.effectiveness!.perceivedEffectiveness);
    const paired = logs.filter((log) => log.effectiveness);
    const corr = correlation(
        paired.map((log) => (log.status === 'taken' ? 1 : 0)),
        paired.map((log) => log.effectiveness!.perceivedEffectiveness),
    );
    const lowInventory = definitions.filter((definition) =>
        definition.inventory
            ? definition.inventory.dosesRemaining <=
              definition.inventory.reorderThreshold
            : false,
    );
    const expiringSoon = definitions.filter((definition) => {
        if (!definition.inventory?.expirationDate) return false;
        const expiration = new Date(
            `${definition.inventory.expirationDate}T00:00:00`,
        );
        const cutoff = new Date(reference);
        cutoff.setDate(cutoff.getDate() + 30);
        return expiration <= cutoff;
    });
    const dailyCost = costPerDay(definitions);
    const insights = [
        logs.length === 0
            ? 'No supplement logs yet.'
            : `7-day adherence is ${Math.round(adherence(logs, 7, reference) * 100)}%.`,
        effectivenessTrend.length < 3
            ? 'Not enough effectiveness data yet.'
            : `Effectiveness trend has ${effectivenessTrend.length} check-ins.`,
        lowInventory.length > 0
            ? `${lowInventory.length} supplement${lowInventory.length === 1 ? '' : 's'} low on inventory.`
            : 'Inventory looks okay where tracked.',
        'Verify supplement and medication interactions with a clinician/pharmacist.',
    ];
    return {
        definitions,
        logs,
        history: logs,
        dueToday,
        takenToday: logs.filter(
            (log) => log.date === today && log.status === 'taken',
        ).length,
        overdueCount: dueToday.filter((dose) => dose.overdue).length,
        nextDose: calculateNextDose(definitions, logs, reference),
        todayAdherence:
            dueToday.length === 0
                ? 0
                : dueToday.filter((dose) => dose.status === 'taken').length /
                  dueToday.length,
        adherence7d: adherence(logs, 7, reference),
        adherence30d: adherence(logs, 30, reference),
        adherenceBySupplement: adherenceBySupplement(logs),
        missedCount,
        skippedCount: skipped.length,
        skippedReasonBreakdown,
        mostMissedTimeOfDay: mostMissedTime(dueToday),
        sideEffectFrequency: sideEffectFrequency(logs),
        effectivenessTrend,
        adherenceEffectivenessCorrelation: corr,
        lowInventory,
        expiringSoon,
        costPerDay: dailyCost,
        costPerMonth: dailyCost * 30,
        insights,
    };
}
