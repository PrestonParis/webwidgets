import type {
    TrackingEntry,
    TrackingMetadata,
} from '@/features/tracking/types/tracking';
import { isBodyZoneId, PAIN_QUALITIES, INJURY_STATUSES } from './types';
import { BODY_REGION_MAP } from './bodyRegions';
import type { TissueType } from './bodyRegions';
import type {
    AllergyLog,
    AllergySeverity,
    AllergyTrigger,
    BiometricDataPoint,
    BiometricWindow,
    BodyMap,
    BodyMapAnalytics,
    BodyZoneEntry,
    BodyZoneId,
    HealthLogEntry,
    InjuryLog,
    InjuryOnset,
    InjuryStatus,
    PainQuality,
    PainType,
    RedFlag,
    RegionSummary,
    Severity,
    SicknessLog,
    SicknessType,
    TemperatureUnit,
} from './types';

// ─── primitive coercion helpers ─────────────────────────────────────────────

function str(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function num(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return undefined;
}

function severity(value: unknown): Severity | undefined {
    const parsed = num(value);
    if (parsed === undefined) return undefined;
    const clamped = Math.max(1, Math.min(10, Math.round(parsed)));
    return clamped as Severity;
}

function bool(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return false;
}

const PAIN_TYPES: PainType[] = ['soreness', 'injury'];
const SICKNESS_TYPES: SicknessType[] = [
    'cold',
    'flu',
    'gi',
    'migraine',
    'allergy',
    'headache',
    'fatigue',
    'other',
];
const ALLERGY_TRIGGERS: AllergyTrigger[] = [
    'pollen',
    'dust',
    'pet',
    'food',
    'mold',
    'medication',
    'insect',
    'other',
];
const ALLERGY_SEVERITIES: AllergySeverity[] = ['mild', 'moderate', 'severe'];

function painType(value: unknown): PainType {
    const raw = str(value)?.toLowerCase();
    return raw && (PAIN_TYPES as string[]).includes(raw)
        ? (raw as PainType)
        : 'soreness';
}

function sicknessType(value: unknown): SicknessType {
    const raw = str(value)?.toLowerCase();
    return raw && (SICKNESS_TYPES as string[]).includes(raw)
        ? (raw as SicknessType)
        : 'other';
}

function allergyTrigger(value: unknown): AllergyTrigger {
    const raw = str(value)?.toLowerCase();
    return raw && (ALLERGY_TRIGGERS as string[]).includes(raw)
        ? (raw as AllergyTrigger)
        : 'other';
}

function allergySeverity(value: unknown): AllergySeverity {
    const raw = str(value)?.toLowerCase();
    return raw && (ALLERGY_SEVERITIES as string[]).includes(raw)
        ? (raw as AllergySeverity)
        : 'mild';
}

function temperatureUnit(value: unknown): TemperatureUnit {
    return str(value)?.toUpperCase() === 'C' ? 'C' : 'F';
}

// ─── per-field normalizers ──────────────────────────────────────────────────

function normalizeBodyMap(
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
        result[zoneId] = entry;
    }
    return Object.keys(result).length > 0 ? result : undefined;
}

function normalizeBiometrics(
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

function normalizeAllergies(
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

function normalizeSickness(
    raw: unknown,
    fallbackTimestamp: string,
): SicknessLog | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const record = raw as Record<string, unknown>;
    if (record['type'] === undefined && record['notes'] === undefined)
        return undefined;
    const log: SicknessLog = {
        type: sicknessType(record['type']),
        medicationTaken: bool(record['medicationTaken']),
        temperatureUnit: temperatureUnit(record['temperatureUnit']),
        timestamp: str(record['timestamp']) ?? fallbackTimestamp,
    };
    const temperature = num(record['temperature']);
    if (temperature !== undefined) log.temperature = temperature;
    const notes = str(record['notes']);
    if (notes !== undefined) log.notes = notes;
    return log;
}

// ─── entry normalization ────────────────────────────────────────────────────

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

// ─── derived selectors ──────────────────────────────────────────────────────

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

/** Merges the most recent zone entry from the last 7 days into a single BodyMap. */
export function getActiveBodyZones(
    entries: HealthLogEntry[],
    reference = new Date(),
): BodyMap {
    const result: BodyMap = {};
    const seenDate: Partial<Record<string, string>> = {};
    // entries are newest-first; only consider the last 7 days
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
        if (!entry.biometrics) continue;
        if (!withinDays(entry.date, reference, days)) continue;
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

function average(values: number[]): number | null {
    if (values.length === 0) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

/**
 * Builds a BaseTrackingEntry-ready metadata patch that records a single body-zone
 * change for the given date, merged onto the existing entry's body map (if any).
 * Pass `zoneEntry: null` to clear a zone.
 */
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
    recentSickness: SicknessLog | null;
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
            .map((entry) => entry.energyLevel)
            .filter((value): value is Severity => value !== undefined),
    );
    const avgSleep7d = average(
        last7
            .map((entry) => entry.sleepQuality)
            .filter((value): value is Severity => value !== undefined),
    );

    // HRV / RHR delta: today's (or latest) value vs the 7-day average.
    const series7 = getBiometricSeries(entries, '7d', reference);
    const latestBiometric = series7[series7.length - 1] ?? null;
    const avgHrv = average(
        series7
            .map((point) => point.hrv)
            .filter((value): value is number => value !== undefined),
    );
    const avgRhr = average(
        series7
            .map((point) => point.rhr)
            .filter((value): value is number => value !== undefined),
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
            (entry) =>
                entry.sickness !== undefined &&
                withinDays(entry.date, reference, 14),
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

// ─── comprehensive injury-log analytics ─────────────────────────────────────
// Injury logs live in a health entry's metadata under `injuryLogs`. These
// functions are pure: no React, no side effects, no API calls.

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

function painQualities(value: unknown): PainQuality[] {
    if (!Array.isArray(value)) return [];
    const result: PainQuality[] = [];
    for (const item of value) {
        const raw = str(item)?.toLowerCase();
        if (raw && (PAIN_QUALITIES as string[]).includes(raw)) {
            result.push(raw as PainQuality);
        }
    }
    return result;
}

function redFlags(value: unknown): RedFlag[] {
    if (!Array.isArray(value)) return [];
    const result: RedFlag[] = [];
    for (const item of value) {
        const raw = str(item);
        if (raw && (RED_FLAGS as string[]).includes(raw)) {
            result.push(raw as RedFlag);
        }
    }
    return result;
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
        painQualities: painQualities(record['painQualities']),
        onset: injuryOnset(record['onset']),
        symptoms: str(record['symptoms']) ?? '',
        mobilityImpact: clampSeverity(record['mobilityImpact'], 1),
        hasSwelling: bool(record['hasSwelling']),
        hasBruising: bool(record['hasBruising']),
        hasBleeding: bool(record['hasBleeding']),
        status: injuryStatus(record['status']),
        createdAt,
        updatedAt: str(record['updatedAt']) ?? createdAt,
        redFlags: redFlags(record['redFlags']),
    };
    const cause = str(record['cause']);
    if (cause !== undefined) log.cause = cause;
    const notes = str(record['notes']);
    if (notes !== undefined) log.notes = notes;
    const resolvedAt = str(record['resolvedAt']);
    if (resolvedAt !== undefined) log.resolvedAt = resolvedAt;
    return log;
}

/** Flattens every `metadata.injuryLogs` array across health entries, newest first. */
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

const UNRESOLVED_STATUSES: InjuryStatus[] = ['active', 'improving', 'chronic'];

function isUnresolved(log: InjuryLog): boolean {
    return UNRESOLVED_STATUSES.includes(log.status);
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

const SORENESS_INJURY_TYPES = new Set([
    'soreness',
    'doms',
    'tightness',
    'cramp',
]);

function isSoreness(log: InjuryLog): boolean {
    return SORENESS_INJURY_TYPES.has(log.injuryType.toLowerCase());
}

export function computeBodyMapAnalytics(
    logs: InjuryLog[],
    reference = new Date(),
): BodyMapAnalytics {
    const summaries = getActiveRegionSummaries(logs);
    const unresolved = logs.filter(isUnresolved);

    const recentCutoff = daysAgo(reference, 7).getTime();
    const recentlyLogged = summaries.filter((summary) => {
        const ts = new Date(summary.lastLoggedAt).getTime();
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

// ─── color scale ────────────────────────────────────────────────────────────

const SEVERITY_SCALES: Record<
    'soreness' | 'injury' | 'general',
    { low: string; high: string }
> = {
    soreness: { low: '#fef9c3', high: '#ea580c' },
    injury: { low: '#fce7f3', high: '#dc2626' },
    general: { low: '#ede9fe', high: '#7c3aed' },
};

/** Returns an interpolated hex/rgb color for an intensity (1–10). */
export function getSeverityColor(
    type: 'soreness' | 'injury' | 'general',
    intensity: number,
): string {
    const scale = SEVERITY_SCALES[type];
    const clamped = Math.max(1, Math.min(10, intensity));
    const t = (clamped - 1) / 9;
    return lerpHex(scale.low, scale.high, t);
}

function lerpHex(from: string, to: string, t: number): string {
    const clamp = Math.max(0, Math.min(1, t));
    const a = hexToRgb(from);
    const b = hexToRgb(to);
    const r = Math.round(a.r + (b.r - a.r) * clamp);
    const g = Math.round(a.g + (b.g - a.g) * clamp);
    const bl = Math.round(a.b + (b.b - a.b) * clamp);
    return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '');
    return {
        r: parseInt(clean.slice(0, 2), 16),
        g: parseInt(clean.slice(2, 4), 16),
        b: parseInt(clean.slice(4, 6), 16),
    };
}

// ─── red-flag detection ─────────────────────────────────────────────────────

const HEAD_REGION_IDS = new Set(['head-front', 'head-back']);

/**
 * Inspects a (possibly partial) injury log and returns the red flags its data
 * implies. Pure — used both live in the drawer and during normalization.
 */
export function detectRedFlags(log: Partial<InjuryLog>): RedFlag[] {
    const flags = new Set<RedFlag>();

    // Any flags the caller already recorded explicitly.
    for (const flag of log.redFlags ?? []) flags.add(flag);

    const severity = log.severity ?? 0;
    const mobility = log.mobilityImpact ?? 0;
    const tissue = log.tissueType;
    const onset = log.onset;
    const qualities = new Set(log.painQualities ?? []);
    const haystack =
        `${log.symptoms ?? ''} ${log.notes ?? ''} ${log.cause ?? ''}`.toLowerCase();

    if (log.hasSwelling && severity >= 7) flags.add('severe_swelling');
    if (log.hasBleeding && severity >= 8) flags.add('spreading_infection');

    if (tissue === 'nerve' && (qualities.has('numb') || mobility >= 8)) {
        flags.add('numbness_loss_of_function');
    }
    if (mobility >= 9) flags.add('numbness_loss_of_function');

    if (
        log.bodyRegionId &&
        HEAD_REGION_IDS.has(log.bodyRegionId) &&
        (severity >= 6 || tissue === 'bone' || tissue === 'nerve')
    ) {
        flags.add('head_injury');
    }

    if (severity >= 9 && onset === 'sudden') {
        flags.add('severe_unexplained_pain');
    }

    // Keyword scan of the free-text fields.
    if (/deform|crooked|out of place|dislocat/.test(haystack))
        flags.add('deformity');
    if (/pass(ed)? out|faint|unconscious|black(ed)? out/.test(haystack))
        flags.add('loss_of_consciousness');
    if (
        /chest pain|short(ness)? of breath|can'?t breathe|breathless/.test(
            haystack,
        )
    )
        flags.add('chest_pain_shortness_breath');
    if (/infect|pus|red streak|fever/.test(haystack))
        flags.add('spreading_infection');
    if (/numb|can'?t move|no feeling|loss of function/.test(haystack))
        flags.add('numbness_loss_of_function');
    if (/head injury|concussion|hit my head|head trauma/.test(haystack))
        flags.add('head_injury');

    return [...flags];
}

export function hasRedFlags(log: InjuryLog): boolean {
    return detectRedFlags(log).length > 0;
}

// ─── persistence helpers ────────────────────────────────────────────────────
// Each injury log is stored as its own health TrackingEntry whose metadata
// holds a single-element `injuryLogs` array. This keeps status updates simple
// (find the owning entry by log id) and leaves the legacy `bodyMap` untouched.

/** Builds the metadata for a brand-new injury log (id + timestamps assigned). */
export function buildNewInjuryLog(
    draft: Omit<InjuryLog, 'id' | 'createdAt' | 'updatedAt'>,
    now = new Date(),
): InjuryLog {
    const iso = now.toISOString();
    return {
        ...draft,
        id: `inj_${now.getTime()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: iso,
        updatedAt: iso,
        redFlags:
            draft.redFlags.length > 0 ? draft.redFlags : detectRedFlags(draft),
    };
}

export function injuryLogToMetadata(log: InjuryLog): TrackingMetadata {
    return { injuryLogs: [log], injuryRegionId: log.bodyRegionId };
}

/** Applies a status change to a single stored log, returning updated metadata. */
export function applyInjuryStatus(
    log: InjuryLog,
    status: InjuryStatus,
    now = new Date(),
): TrackingMetadata {
    const iso = now.toISOString();
    const next: InjuryLog = {
        ...log,
        status,
        updatedAt: iso,
        ...(status === 'resolved' ? { resolvedAt: iso } : {}),
    };
    return injuryLogToMetadata(next);
}

/** Finds the TrackingEntry whose metadata holds the injury log with `logId`. */
export function findInjuryEntryId(
    entries: TrackingEntry[],
    logId: string,
): string | null {
    for (const entry of entries) {
        if (entry.category !== 'health') continue;
        const rawLogs = entry.metadata?.['injuryLogs'];
        if (!Array.isArray(rawLogs)) continue;
        for (const rawLog of rawLogs) {
            if (
                rawLog &&
                typeof rawLog === 'object' &&
                (rawLog as Record<string, unknown>)['id'] === logId
            ) {
                return entry.id;
            }
        }
    }
    return null;
}
