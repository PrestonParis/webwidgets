import type { TrackingEntry } from '@/features/tracking/types/trackingEntries';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WeightUnit = 'lbs' | 'kg';
export type HeightUnit = 'in' | 'cm';
export type BMICategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export interface WeightEntry {
    id: string;
    date: string; // YYYY-MM-DD
    weightKg: number;
    heightCm?: number;
    bmi?: number;
    bodyFatPercent?: number;
    notes?: string;
}

export interface WeightAnalytics {
    latest: WeightEntry | null;
    previous: WeightEntry | null;
    currentBMI: number | null;
    bmiCategory: BMICategory | null;
    changeKg: number | null; // latest vs previous entry
    changeLbs: number | null;
    trend7dKg: number | null; // avg daily change over 7 days (negative = losing)
    trend30dKg: number | null;
    highKg: number | null;
    lowKg: number | null;
    entries: WeightEntry[]; // newest-first
}

// ─── Unit conversions ─────────────────────────────────────────────────────────

export function kgToLbs(kg: number): number {
    return kg * 2.20462;
}
export function lbsToKg(lbs: number): number {
    return lbs / 2.20462;
}
export function cmToIn(cm: number): number {
    return cm / 2.54;
}
export function inToCm(inches: number): number {
    return inches * 2.54;
}
export function cmToFtIn(cm: number): { ft: number; in: number } {
    const totalIn = cmToIn(cm);
    return { ft: Math.floor(totalIn / 12), in: Math.round(totalIn % 12) };
}
export function ftInToCm(ft: number, inches: number): number {
    return inToCm(ft * 12 + inches);
}

// ─── BMI ──────────────────────────────────────────────────────────────────────

export function calculateBMI(weightKg: number, heightCm: number): number {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
}

export function getBMICategory(bmi: number): BMICategory {
    if (bmi < 18.5) return 'underweight';
    if (bmi < 25) return 'normal';
    if (bmi < 30) return 'overweight';
    return 'obese';
}

export const BMI_CATEGORY_LABELS: Record<BMICategory, string> = {
    underweight: 'Underweight',
    normal: 'Normal weight',
    overweight: 'Overweight',
    obese: 'Obese',
};

export const BMI_CATEGORY_COLOR: Record<BMICategory, string> = {
    underweight: 'text-sky-600 dark:text-sky-400',
    normal: 'text-emerald-600 dark:text-emerald-400',
    overweight: 'text-amber-600 dark:text-amber-400',
    obese: 'text-rose-600 dark:text-rose-400',
};

export const BMI_CATEGORY_BADGE: Record<BMICategory, string> = {
    underweight: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    normal: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    overweight:
        'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    obese: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

// ─── Normalization ────────────────────────────────────────────────────────────

export function normalizeWeightEntries(
    entries: TrackingEntry[],
): WeightEntry[] {
    return entries
        .filter(
            (e) =>
                e.category === 'health' &&
                e.metadata?.['weightEntryType'] === 'weight',
        )
        .map((e): WeightEntry | null => {
            const m = e.metadata;
            const rawKg = m['weightKg'];
            if (typeof rawKg !== 'number') return null;
            const heightCm =
                typeof m['heightCm'] === 'number' ? m['heightCm'] : undefined;
            const bmi =
                heightCm != null
                    ? calculateBMI(rawKg, heightCm)
                    : typeof m['bmi'] === 'number'
                      ? m['bmi']
                      : undefined;
            const bodyFatPercent =
                typeof m['bodyFatPercent'] === 'number'
                    ? m['bodyFatPercent']
                    : undefined;
            const notes = typeof e.notes === 'string' ? e.notes : undefined;
            return {
                id: e.id,
                date: e.entryDate,
                weightKg: rawKg,
                ...(heightCm !== undefined ? { heightCm } : {}),
                ...(bmi !== undefined ? { bmi } : {}),
                ...(bodyFatPercent !== undefined ? { bodyFatPercent } : {}),
                ...(notes !== undefined ? { notes } : {}),
            };
        })
        .filter((e): e is WeightEntry => e !== null)
        .sort((a, b) => b.date.localeCompare(a.date)); // newest first
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export function computeWeightAnalytics(
    entries: WeightEntry[],
): WeightAnalytics {
    const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));
    const latest = sorted[0] ?? null;
    const previous = sorted[1] ?? null;

    const currentBMI = latest?.bmi ?? null;
    const bmiCategory = currentBMI !== null ? getBMICategory(currentBMI) : null;
    const changeKg =
        latest && previous ? latest.weightKg - previous.weightKg : null;
    const changeLbs = changeKg !== null ? kgToLbs(changeKg) : null;

    const daysAgo = (n: number) =>
        new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

    function trendOverWindow(windowEntries: WeightEntry[]): number | null {
        if (windowEntries.length < 2) return null;
        const first = windowEntries[windowEntries.length - 1]!;
        const last = windowEntries[0]!;
        const days = Math.max(
            1,
            (new Date(last.date).getTime() - new Date(first.date).getTime()) /
                86_400_000,
        );
        return (last.weightKg - first.weightKg) / days;
    }

    const trend7dKg = trendOverWindow(
        sorted.filter((e) => e.date >= daysAgo(7)),
    );
    const trend30dKg = trendOverWindow(
        sorted.filter((e) => e.date >= daysAgo(30)),
    );

    const weights = sorted.map((e) => e.weightKg);
    const highKg = weights.length > 0 ? Math.max(...weights) : null;
    const lowKg = weights.length > 0 ? Math.min(...weights) : null;

    return {
        latest,
        previous,
        currentBMI,
        bmiCategory,
        changeKg,
        changeLbs,
        trend7dKg,
        trend30dKg,
        highKg,
        lowKg,
        entries: sorted,
    };
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function fmtWeight(kg: number, unit: WeightUnit): string {
    if (unit === 'lbs') return `${kgToLbs(kg).toFixed(1)} lbs`;
    return `${kg.toFixed(1)} kg`;
}

export function fmtHeight(cm: number, unit: HeightUnit): string {
    if (unit === 'in') {
        const { ft, in: inches } = cmToFtIn(cm);
        return `${ft}'${inches}"`;
    }
    return `${cm.toFixed(0)} cm`;
}

export function fmtTrend(
    trendPerDayKg: number | null,
    unit: WeightUnit,
): string {
    if (trendPerDayKg === null) return 'N/A';
    const weekKg = trendPerDayKg * 7;
    const val = unit === 'lbs' ? kgToLbs(weekKg) : weekKg;
    const sign = val > 0 ? '+' : '';
    return `${sign}${val.toFixed(1)} ${unit}/wk`;
}
