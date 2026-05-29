import type {
    TrackingEntry,
    TrackingMetadata,
} from '@/features/tracking/types/trackingEntries';
import type {
    InjuryLog,
    InjuryStatus,
    RedFlag,
} from '@/features/tracking/health/types/health';
import { lerpHex } from './analyticsCoerce';

const SEVERITY_SCALES: Record<
    'soreness' | 'injury' | 'general',
    { low: string; high: string }
> = {
    soreness: { low: '#fef9c3', high: '#ea580c' },
    injury: { low: '#fce7f3', high: '#dc2626' },
    general: { low: '#ede9fe', high: '#7c3aed' },
};

export function getSeverityColor(
    type: 'soreness' | 'injury' | 'general',
    intensity: number,
): string {
    const scale = SEVERITY_SCALES[type];
    const clamped = Math.max(1, Math.min(10, intensity));
    return lerpHex(scale.low, scale.high, (clamped - 1) / 9);
}

const HEAD_REGION_IDS = new Set(['head-front', 'head-back']);

export function detectRedFlags(log: Partial<InjuryLog>): RedFlag[] {
    const flags = new Set<RedFlag>();
    for (const flag of log.redFlags ?? []) flags.add(flag);

    const sev = log.severity ?? 0;
    const mobility = log.mobilityImpact ?? 0;
    const tissue = log.tissueType;
    const onset = log.onset;
    const qualities = new Set(log.painQualities ?? []);
    const haystack =
        `${log.symptoms ?? ''} ${log.notes ?? ''} ${log.cause ?? ''}`.toLowerCase();

    if (log.hasSwelling && sev >= 7) flags.add('severe_swelling');
    if (log.hasBleeding && sev >= 8) flags.add('spreading_infection');
    if (tissue === 'nerve' && (qualities.has('numb') || mobility >= 8))
        flags.add('numbness_loss_of_function');
    if (mobility >= 9) flags.add('numbness_loss_of_function');
    if (
        log.bodyRegionId &&
        HEAD_REGION_IDS.has(log.bodyRegionId) &&
        (sev >= 6 || tissue === 'bone' || tissue === 'nerve')
    )
        flags.add('head_injury');
    if (sev >= 9 && onset === 'sudden') flags.add('severe_unexplained_pain');

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
