import type { TrackingMetadata } from '@/features/tracking/types/trackingEntryTypes';
import { isBodyZoneId } from './types';
import type {
    BiometricDataPoint,
    BiometricWindow,
    BodyMap,
    BodyMapAnalytics,
    BodyZoneEntry,
    BodyZoneId,
    HealthLogEntry,
    InjuryLog,
    InjuryStatus,
    RegionSummary,
    Severity,
} from './types';
import { BODY_REGION_MAP } from './bodyRegions';
import type { TissueType } from './bodyRegions';

function daysAgo(reference: Date, days: number): Date {
    const copy = new Date(reference);
    copy.setHours(0, 0, 0, 0);
    copy.setDate(copy.getDate() - days);
    return copy;
}

function withinDays(date: string, reference: Date, days: number): boolean {
    const value = new Date(`${date}T00:00:00`);
    return value >= daysAgo(reference, days) && value <= reference;
}

function average(values: number[]): number | null {
    if (values.length === 0) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function getActiveBodyZones(
    entries: HealthLogEntry[],
    reference = new Date(),
): BodyMap {
    const result: BodyMap = {};
    const seenDate: Partial<Record<string, string>> = {};
    for (const entry of entries) {
        if (!withinDays(entry.date, reference, 7)) continue;
        if (!entry.bodyMap) continue;
        for (const [zoneId, zoneEntry] of Object.entries(entry.bodyMap)) {
            if (!zoneEntry || !isBodyZoneId(zoneId)) continue;
            const previous = seenDate[zoneId];
            if (previous === undefined || zoneEntry.timestamp > previous) {
                result[zoneId] = zoneEntry;
                seenDate[zoneId] = zoneEntry.timestamp;
            }
        }
    }
    return result;
}

const WINDOW_DAYS: Record<BiometricWindow, number> = {
    '7d': 7,
    '30d': 30,
    '90d': 90,
};

export function getBiometricSeries(
    entries: HealthLogEntry[],
    window: BiometricWindow,
    reference = new Date(),
): BiometricDataPoint[] {
    const days = WINDOW_DAYS[window];
    const byDate = new Map<string, BiometricDataPoint>();
    for (const entry of entries) {
        if (!entry.biometrics || !withinDays(entry.date, reference, days))
            continue;
        const existing = byDate.get(entry.biometrics.date);
        if (existing) {
            if (
                existing.hrv === undefined &&
                entry.biometrics.hrv !== undefined
            )
                existing.hrv = entry.biometrics.hrv;
            if (
                existing.rhr === undefined &&
                entry.biometrics.rhr !== undefined
            )
                existing.rhr = entry.biometrics.rhr;
        } else {
            byDate.set(entry.biometrics.date, { ...entry.biometrics });
        }
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function buildBodyMapMetadata(
    existing: HealthLogEntry | undefined,
    zoneId: BodyZoneId,
    zoneEntry: BodyZoneEntry | null,
): TrackingMetadata {
    const nextMap: BodyMap = { ...(existing?.bodyMap ?? {}) };
    if (zoneEntry === null) {
        delete nextMap[zoneId];
    } else {
        nextMap[zoneId] = zoneEntry;
    }
    const metadata: TrackingMetadata = { bodyMap: nextMap };
    if (existing?.energyLevel !== undefined)
        metadata['energyLevel'] = existing.energyLevel;
    if (existing?.sleepQuality !== undefined)
        metadata['sleepQuality'] = existing.sleepQuality;
    if (existing?.biometrics !== undefined)
        metadata['biometrics'] = existing.biometrics;
    if (existing?.allergies !== undefined)
        metadata['allergies'] = existing.allergies;
    if (existing?.sickness !== undefined)
        metadata['sickness'] = existing.sickness;
    return metadata;
}

export interface HealthAnalytics {
    todayEntry: HealthLogEntry | null;
    activeZoneCount: number;
    avgEnergy7d: number | null;
    avgSleep7d: number | null;
    hrvDelta: number | null;
    rhrDelta: number | null;
    recentSickness: HealthLogEntry['sickness'] | null;
}

export function computeHealthAnalytics(
    entries: HealthLogEntry[],
    reference = new Date(),
): HealthAnalytics {
    const today = reference.toISOString().slice(0, 10);
    const todayEntry = entries.find((entry) => entry.date === today) ?? null;
    const activeZones = getActiveBodyZones(entries, reference);
    const last7 = entries.filter((entry) =>
        withinDays(entry.date, reference, 7),
    );
    const avgEnergy7d = average(
        last7
            .map((e) => e.energyLevel)
            .filter((v): v is Severity => v !== undefined),
    );
    const avgSleep7d = average(
        last7
            .map((e) => e.sleepQuality)
            .filter((v): v is Severity => v !== undefined),
    );
    const series7 = getBiometricSeries(entries, '7d', reference);
    const latestBiometric = series7[series7.length - 1] ?? null;
    const avgHrv = average(
        series7.map((p) => p.hrv).filter((v): v is number => v !== undefined),
    );
    const avgRhr = average(
        series7.map((p) => p.rhr).filter((v): v is number => v !== undefined),
    );
    const hrvDelta =
        latestBiometric?.hrv !== undefined && avgHrv !== null
            ? latestBiometric.hrv - avgHrv
            : null;
    const rhrDelta =
        latestBiometric?.rhr !== undefined && avgRhr !== null
            ? latestBiometric.rhr - avgRhr
            : null;
    const recentSickness =
        entries.find(
            (e) =>
                e.sickness !== undefined && withinDays(e.date, reference, 14),
        )?.sickness ?? null;
    return {
        todayEntry,
        activeZoneCount: Object.keys(activeZones).length,
        avgEnergy7d,
        avgSleep7d,
        hrvDelta,
        rhrDelta,
        recentSickness,
    };
}

const UNRESOLVED_STATUSES: InjuryStatus[] = ['active', 'improving', 'chronic'];
const SORENESS_INJURY_TYPES = new Set([
    'soreness',
    'doms',
    'tightness',
    'cramp',
]);

function isUnresolved(log: InjuryLog): boolean {
    return UNRESOLVED_STATUSES.includes(log.status);
}
function isSoreness(log: InjuryLog): boolean {
    return SORENESS_INJURY_TYPES.has(log.injuryType.toLowerCase());
}

export function getActiveRegionSummaries(logs: InjuryLog[]): RegionSummary[] {
    const byRegion = new Map<string, InjuryLog[]>();
    for (const log of logs) {
        if (!isUnresolved(log)) continue;
        const bucket = byRegion.get(log.bodyRegionId) ?? [];
        bucket.push(log);
        byRegion.set(log.bodyRegionId, bucket);
    }
    const summaries: RegionSummary[] = [];
    for (const [regionId, regionLogs] of byRegion) {
        let maxSeverity = 0;
        let lastLoggedAt = '';
        let hasFlags = false;
        const tissueSet = new Set<TissueType>();
        for (const log of regionLogs) {
            if (log.severity > maxSeverity) maxSeverity = log.severity;
            if (log.createdAt > lastLoggedAt) lastLoggedAt = log.createdAt;
            if (log.redFlags.length > 0) hasFlags = true;
            tissueSet.add(log.tissueType);
        }
        summaries.push({
            regionId,
            activeLogCount: regionLogs.length,
            maxSeverity,
            lastLoggedAt,
            hasRedFlags: hasFlags,
            tissueTypes: [...tissueSet],
        });
    }
    return summaries.sort((a, b) => b.maxSeverity - a.maxSeverity);
}

export function computeBodyMapAnalytics(
    logs: InjuryLog[],
    reference = new Date(),
): BodyMapAnalytics {
    const summaries = getActiveRegionSummaries(logs);
    const unresolved = logs.filter(isUnresolved);
    const recentCutoff = daysAgo(reference, 7).getTime();
    const recentlyLogged = summaries.filter((s) => {
        const ts = new Date(s.lastLoggedAt).getTime();
        return Number.isFinite(ts) && ts >= recentCutoff;
    });
    let leftCount = 0;
    let rightCount = 0;
    let sorenessCount = 0;
    let injuryCount = 0;
    for (const log of unresolved) {
        const region = BODY_REGION_MAP[log.bodyRegionId];
        if (region?.side === 'left') leftCount += 1;
        else if (region?.side === 'right') rightCount += 1;
        if (isSoreness(log)) sorenessCount += 1;
        else injuryCount += 1;
    }
    const sided = leftCount + rightCount;
    const imbalanceScore =
        sided === 0 ? 0 : Math.abs(leftCount - rightCount) / sided;
    return {
        totalActive: unresolved.length,
        ...(summaries[0] ? { mostSevereRegion: summaries[0] } : {}),
        recentlyLogged,
        unresolvedCount: unresolved.length,
        leftRightImbalance: { leftCount, rightCount, imbalanceScore },
        sorenessVsInjuryRatio: { soreness: sorenessCount, injury: injuryCount },
    };
}
