import type { TrackingCategory } from '@/features/tracking/types/trackingCategoryTypes';
import type { ParsedRow } from '@/features/tracking/types/import';

const CATEGORY_KEYWORDS: Record<TrackingCategory, string[]> = {
    sleep: ['sleep', 'bedtime', 'waketime', 'wake_time'],
    workout: ['workout', 'exercise', 'training', 'fitness'],
    meal: ['meal', 'food', 'eating', 'diet', 'nutrition'],
    mood: ['mood', 'feeling', 'emotion', 'mental'],
    supplement: ['supplement', 'vitamin', 'pill', 'medication'],
    symptom: ['symptom', 'pain', 'discomfort', 'ailment'],
    injury: ['injury', 'hurt', 'strain', 'sprain'],
};

const DATE_COLUMN_NAMES = [
    'date',
    'entry_date',
    'day',
    'logged_date',
    'record_date',
    'event_date',
];
const DATE_FORMATS = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // MM/DD/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // MM-DD-YYYY
    /^(\d{4})\/(\d{2})\/(\d{2})$/, // YYYY/MM/DD
];

export function inferCategory(row: ParsedRow): TrackingCategory | null {
    const categoryValue = row.raw['category'] ?? row.raw['type'] ?? '';
    if (categoryValue) {
        const lower = categoryValue.toLowerCase();
        for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
            if (keywords.some((kw) => lower.includes(kw))) {
                return cat;
            }
        }
    }

    const columnNames = Object.keys(row.raw).join(' ').toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some((kw) => columnNames.includes(kw))) {
            return cat;
        }
    }

    return null;
}

function parseDateString(value: string): string | null {
    const trimmed = value.trim();

    const isoMatch = DATE_FORMATS[0]?.exec(trimmed);
    if (isoMatch) return trimmed;

    const mmddMatch = DATE_FORMATS[1]?.exec(trimmed);
    if (mmddMatch) return `${mmddMatch[3]}-${mmddMatch[1]}-${mmddMatch[2]}`;

    const mmddDashMatch = DATE_FORMATS[2]?.exec(trimmed);
    if (mmddDashMatch)
        return `${mmddDashMatch[3]}-${mmddDashMatch[1]}-${mmddDashMatch[2]}`;

    const yyyySlashMatch = DATE_FORMATS[3]?.exec(trimmed);
    if (yyyySlashMatch)
        return `${yyyySlashMatch[1]}-${yyyySlashMatch[2]}-${yyyySlashMatch[3]}`;

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }

    return null;
}

export function extractEntryDate(row: ParsedRow): string | null {
    for (const col of DATE_COLUMN_NAMES) {
        const val = row.raw[col];
        if (val) {
            const parsed = parseDateString(val);
            if (parsed) return parsed;
        }
    }

    for (const [key, val] of Object.entries(row.raw)) {
        if (key.includes('date') || key.includes('day')) {
            const parsed = parseDateString(val);
            if (parsed) return parsed;
        }
    }

    return null;
}

const SLEEP_COLS = [
    'bedtime',
    'wake_time',
    'waketime',
    'quality',
    'duration',
    'duration_hours',
];
const WORKOUT_COLS = [
    'workout_type',
    'type',
    'duration',
    'intensity',
    'exercise_type',
];
const MEAL_COLS = [
    'meal_type',
    'mealtype',
    'description',
    'protein',
    'calories',
    'time',
];
const MOOD_COLS = ['score', 'mood_score', 'energy'];
const SUPPLEMENT_COLS = ['name', 'supplement_name', 'dose', 'taken'];
const SYMPTOM_COLS = ['name', 'symptom_name', 'severity'];
const INJURY_COLS = ['location', 'injury_location', 'severity'];

const CATEGORY_COL_MAP: Record<TrackingCategory, string[]> = {
    sleep: SLEEP_COLS,
    workout: WORKOUT_COLS,
    meal: MEAL_COLS,
    mood: MOOD_COLS,
    supplement: SUPPLEMENT_COLS,
    symptom: SYMPTOM_COLS,
    injury: INJURY_COLS,
};

export function buildMetadata(
    row: ParsedRow,
    category: TrackingCategory,
): Record<string, unknown> {
    const relevantCols = CATEGORY_COL_MAP[category] ?? [];
    const meta: Record<string, unknown> = {};

    for (const col of relevantCols) {
        const val = row.raw[col];
        if (val === undefined || val === '') continue;

        const num = Number(val);
        if (!isNaN(num) && val !== '') {
            meta[col] = num;
        } else if (val.toLowerCase() === 'true') {
            meta[col] = true;
        } else if (val.toLowerCase() === 'false') {
            meta[col] = false;
        } else {
            meta[col] = val;
        }
    }

    return meta;
}
