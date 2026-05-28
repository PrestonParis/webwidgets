import type {
    TrackingEntry,
    TrackingMetadata,
} from '@/features/tracking/types/trackingEntries';
import {
    isBodyZoneId,
    INJURY_STATUSES,
    PAIN_QUALITIES,
} from '@/features/tracking/health/types/health';
import type {
    AllergyLog,
    BiometricDataPoint,
    BodyMap,
    BodyZoneEntry,
    BodyZoneId,
    HealthLogEntry,
    InjuryLog,
    InjuryOnset,
    InjuryStatus,
    PainQuality,
    RedFlag,
} from '@/features/tracking/health/types/health';
import type { TissueType } from './bodyRegions';
import {
    str,
    num,
    severity,
    bool,
    painType,
    sicknessType,
    allergyTrigger,
    allergySeverity,
    temperatureUnit,
} from './analyticsCoerce';

const TISSUE_TYPES: TissueType[] = [
    'surface',
    'muscle',
    'tendon',
    'bone',
    'nerve',
    'general',
];
const RED_FLAGS: RedFlag[] = [
    'severe_swelling',
    'deformity',
    'numbness_loss_of_function',
    'head_injury',
    'spreading_infection',
    'severe_unexplained_pain',
    'loss_of_consciousness',
    'chest_pain_shortness_breath',
];
const ONSETS: InjuryOnset[] = ['sudden', 'gradual', 'unknown'];

export function normalizeBodyMap(
    raw: unknown,
    fallbackTimestamp: string,
): BodyMap | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const result: BodyMap = {};
    for (const [zoneId, value] of Object.entries(
        raw as Record<string, unknown>,
    )) {
        if (!isBodyZoneId(zoneId) || !value || typeof value !== 'object')
            continue;
        const record = value as Record<string, unknown>;
        const intensity = severity(record['intensity']);
        if (intensity === undefined) continue;
        const entry: BodyZoneEntry = {
            type: painType(record['type']),
            intensity,
            timestamp: str(record['timestamp']) ?? fallbackTimestamp,
        };
        const notes = str(record['notes']);
        if (notes !== undefined) entry.notes = notes;
        result[zoneId as BodyZoneId] = entry;
    }
    return Object.keys(result).length > 0 ? result : undefined;
}

export function normalizeBiometrics(
    raw: unknown,
    date: string,
): BiometricDataPoint | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const record = raw as Record<string, unknown>;
    const hrv = num(record['hrv']);
    const rhr = num(record['rhr'] ?? record['restingHeartRate']);
    if (hrv === undefined && rhr === undefined) return undefined;
    const point: BiometricDataPoint = { date: str(record['date']) ?? date };
    if (hrv !== undefined) point.hrv = hrv;
    if (rhr !== undefined) point.rhr = rhr;
    return point;
}

export function normalizeAllergies(
    raw: unknown,
    fallbackTimestamp: string,
): AllergyLog[] | undefined {
    if (!Array.isArray(raw)) return undefined;
    const result: AllergyLog[] = [];
    for (const value of raw) {
        if (!value || typeof value !== 'object') continue;
        const record = value as Record<string, unknown>;
        const symptoms = str(record['symptoms']);
        if (!symptoms) continue;
        result.push({
            trigger: allergyTrigger(record['trigger']),
            severity: allergySeverity(record['severity']),
            symptoms,
            timestamp: str(record['timestamp']) ?? fallbackTimestamp,
        });
    }
    return result.length > 0 ? result : undefined;
}

export function normalizeSickness(raw: unknown, fallbackTimestamp: string) {
    if (!raw || typeof raw !== 'object') return undefined;
    const record = raw as Record<string, unknown>;
    if (record['type'] === undefined && record['notes'] === undefined)
        return undefined;
    const log = {
        type: sicknessType(record['type']),
        medicationTaken: bool(record['medicationTaken']),
        temperatureUnit: temperatureUnit(record['temperatureUnit']),
        timestamp: str(record['timestamp']) ?? fallbackTimestamp,
        ...(num(record['temperature']) !== undefined
            ? { temperature: num(record['temperature'])! }
            : {}),
        ...(str(record['notes']) !== undefined
            ? { notes: str(record['notes'])! }
            : {}),
    };
    return log;
}

export function normalizeHealthEntry(
    entry: TrackingEntry,
): HealthLogEntry | null {
    if (entry.category !== 'health') return null;
    const meta: TrackingMetadata = entry.metadata ?? {};
    const fallbackTimestamp = `${entry.entryDate}T00:00:00`;
    const log: HealthLogEntry = { id: entry.id, date: entry.entryDate };

    const energyLevel = severity(meta['energyLevel']);
    if (energyLevel !== undefined) log.energyLevel = energyLevel;
    const sleepQuality = severity(meta['sleepQuality']);
    if (sleepQuality !== undefined) log.sleepQuality = sleepQuality;

    const bodyMap = normalizeBodyMap(meta['bodyMap'], fallbackTimestamp);
    if (bodyMap !== undefined) log.bodyMap = bodyMap;
    const biometrics = normalizeBiometrics(meta['biometrics'], entry.entryDate);
    if (biometrics !== undefined) log.biometrics = biometrics;
    const allergies = normalizeAllergies(meta['allergies'], fallbackTimestamp);
    if (allergies !== undefined) log.allergies = allergies;
    const sickness = normalizeSickness(meta['sickness'], fallbackTimestamp);
    if (sickness !== undefined) log.sickness = sickness;
    const notes = str(entry.notes ?? meta['notes']);
    if (notes !== undefined) log.notes = notes;

    return log;
}

export function normalizeHealthEntries(
    entries: TrackingEntry[],
): HealthLogEntry[] {
    return entries
        .map(normalizeHealthEntry)
        .filter((log): log is HealthLogEntry => log !== null)
        .sort(
            (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
        );
}

function clampSeverity(value: unknown, fallback: number): number {
    const parsed = num(value);
    if (parsed === undefined) return fallback;
    return Math.max(1, Math.min(10, Math.round(parsed)));
}

function tissueType(value: unknown): TissueType {
    const raw = str(value)?.toLowerCase();
    return raw && (TISSUE_TYPES as string[]).includes(raw)
        ? (raw as TissueType)
        : 'general';
}

function injuryStatus(value: unknown): InjuryStatus {
    const raw = str(value)?.toLowerCase();
    return raw && (INJURY_STATUSES as string[]).includes(raw)
        ? (raw as InjuryStatus)
        : 'active';
}

function injuryOnset(value: unknown): InjuryOnset {
    const raw = str(value)?.toLowerCase();
    return raw && (ONSETS as string[]).includes(raw)
        ? (raw as InjuryOnset)
        : 'unknown';
}

function parsePainQualities(value: unknown): PainQuality[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
        const raw = str(item)?.toLowerCase();
        return raw && (PAIN_QUALITIES as string[]).includes(raw)
            ? [raw as PainQuality]
            : [];
    });
}

function parseRedFlags(value: unknown): RedFlag[] {
    if (!Array.isArray(value)) return [];
    return value.flatMap((item) => {
        const raw = str(item);
        return raw && (RED_FLAGS as string[]).includes(raw)
            ? [raw as RedFlag]
            : [];
    });
}

function normalizeInjuryLog(
    raw: unknown,
    fallbackTimestamp: string,
): InjuryLog | null {
    if (!raw || typeof raw !== 'object') return null;
    const record = raw as Record<string, unknown>;
    const bodyRegionId = str(record['bodyRegionId']);
    if (!bodyRegionId) return null;
    const createdAt = str(record['createdAt']) ?? fallbackTimestamp;
    const log: InjuryLog = {
        id: str(record['id']) ?? `${bodyRegionId}-${createdAt}`,
        bodyRegionId,
        tissueType: tissueType(record['tissueType']),
        injuryType: str(record['injuryType']) ?? 'general pain',
        severity: clampSeverity(record['severity'], 3),
        painQualities: parsePainQualities(record['painQualities']),
        onset: injuryOnset(record['onset']),
        symptoms: str(record['symptoms']) ?? '',
        mobilityImpact: clampSeverity(record['mobilityImpact'], 1),
        hasSwelling: bool(record['hasSwelling']),
        hasBruising: bool(record['hasBruising']),
        hasBleeding: bool(record['hasBleeding']),
        status: injuryStatus(record['status']),
        createdAt,
        updatedAt: str(record['updatedAt']) ?? createdAt,
        redFlags: parseRedFlags(record['redFlags']),
    };
    const cause = str(record['cause']);
    if (cause !== undefined) log.cause = cause;
    const notes = str(record['notes']);
    if (notes !== undefined) log.notes = notes;
    const resolvedAt = str(record['resolvedAt']);
    if (resolvedAt !== undefined) log.resolvedAt = resolvedAt;
    return log;
}

export function normalizeInjuryLogs(entries: TrackingEntry[]): InjuryLog[] {
    const result: InjuryLog[] = [];
    for (const entry of entries) {
        if (entry.category !== 'health') continue;
        const meta: TrackingMetadata = entry.metadata ?? {};
        const rawLogs = meta['injuryLogs'];
        if (!Array.isArray(rawLogs)) continue;
        const fallback = `${entry.entryDate}T00:00:00.000Z`;
        for (const rawLog of rawLogs) {
            const log = normalizeInjuryLog(rawLog, fallback);
            if (log) result.push(log);
        }
    }
    return result.sort(
        (a, b) =>
            b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id),
    );
}

export function getRegionLogs(
    logs: InjuryLog[],
    regionId: string,
): InjuryLog[] {
    return logs
        .filter((log) => log.bodyRegionId === regionId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
