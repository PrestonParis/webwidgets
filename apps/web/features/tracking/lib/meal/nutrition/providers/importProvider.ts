/**
 * Nutrition CSV import provider.
 *
 * Parses MyFitnessPal / Cronometer / generic nutrition CSV exports, maps columns
 * to meal entries, detects duplicates against existing entries, and produces a
 * preview before any data is committed. Pure (no DB writes) — committing is done
 * by the caller via the existing tracking API.
 *
 * Uses papaparse (already a project dependency) for robust CSV parsing.
 */

import Papa from 'papaparse';
import type { BaseTrackingEntry } from '@/features/tracking/types/trackingEntries';
import type { MealType } from '@/features/tracking/types/nutritionProviders';
import type {
    ExistingMealSignature,
    NutritionImportFormat,
    NutritionImportPreview,
    NutritionImportRow,
} from '@/features/tracking/types/nutritionImport';

// ─── column synonyms ────────────────────────────────────────────────────────

const COLUMN_SYNONYMS: Record<string, string[]> = {
    date: ['date', 'day', 'logged date', 'log date'],
    mealType: ['meal', 'meal type', 'group', 'category'],
    name: ['name', 'food', 'food name', 'description', 'item'],
    calories: ['calories', 'energy (kcal)', 'energy', 'kcal', 'cals'],
    protein: ['protein', 'protein (g)'],
    carbs: [
        'carbs',
        'carbohydrates',
        'carbohydrates (g)',
        'carbs (g)',
        'net carbs',
        'net carbs (g)',
    ],
    fat: ['fat', 'fat (g)', 'total fat', 'total fat (g)'],
    fiber: ['fiber', 'fibre', 'fiber (g)'],
    sugar: ['sugar', 'sugars', 'sugar (g)'],
    sodium: ['sodium', 'sodium (mg)'],
};

/** Normalize a header for matching. */
function norm(h: string): string {
    return h.trim().toLowerCase();
}

/** Map detected headers -> our canonical field keys. */
function mapColumns(headers: string[]): Record<string, string> {
    const lower = headers.map(norm);
    const mapping: Record<string, string> = {};
    for (const [field, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
        const idx = lower.findIndex((h) => synonyms.includes(h));
        if (idx >= 0) mapping[field] = headers[idx]!;
    }
    return mapping;
}

export function detectFormat(headers: string[]): NutritionImportFormat {
    const lower = headers.map(norm);
    const has = (h: string) => lower.includes(h);
    // MyFitnessPal exports: Date, Meal, Calories, Fat (g), Carbohydrates (g), Protein (g), Sodium (mg), Sugar (g)
    if (has('meal') && (has('carbohydrates (g)') || has('sodium (mg)'))) {
        return 'myfitnesspal';
    }
    // Cronometer exports: Day, Group, Food Name, Energy (kcal), Protein (g), ...
    if (
        (has('day') || has('group')) &&
        (has('energy (kcal)') || has('food name'))
    ) {
        return 'cronometer';
    }
    if (has('date') && (has('calories') || has('energy'))) return 'generic';
    return 'unknown';
}

// ─── value parsing ──────────────────────────────────────────────────────────

function parseNumber(value: string | undefined): number | null {
    if (value === undefined) return null;
    const cleaned = value.replace(/[^0-9.\-]/g, '');
    if (cleaned === '' || cleaned === '-') return null;
    const n = parseFloat(cleaned);
    return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Normalize a date string to YYYY-MM-DD; null if unparseable. */
export function parseDate(value: string | undefined): string | null {
    if (!value) return null;
    const v = value.trim();
    // already ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    // M/D/YYYY or MM/DD/YYYY
    const slash = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (slash) {
        const [, mm, dd, yy] = slash;
        const year = yy!.length === 2 ? `20${yy}` : yy!;
        return `${year}-${mm!.padStart(2, '0')}-${dd!.padStart(2, '0')}`;
    }
    const parsed = new Date(v);
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }
    return null;
}

const MEAL_TYPE_MAP: Record<string, MealType> = {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    snack: 'snack',
    snacks: 'snack',
    'morning snack': 'snack',
    'afternoon snack': 'snack',
    'evening snack': 'snack',
};

export function parseMealType(value: string | undefined): MealType | null {
    if (!value) return null;
    const v = value.trim().toLowerCase();
    return MEAL_TYPE_MAP[v] ?? null;
}

// ─── duplicate detection ────────────────────────────────────────────────────

function signatureKey(sig: ExistingMealSignature): string {
    return `${sig.date}|${sig.mealType ?? ''}|${sig.calories ?? ''}`;
}

// ─── preview build ──────────────────────────────────────────────────────────

/**
 * Parse CSV content into a preview. Does not write anything.
 * @param content   raw CSV text
 * @param existing  signatures of already-logged meals for duplicate detection
 */
export function buildImportPreview(
    content: string,
    existing: ExistingMealSignature[] = [],
): NutritionImportPreview {
    const parsed = Papa.parse<Record<string, string>>(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
    });

    const headers = parsed.meta.fields ?? [];
    const format = detectFormat(headers);
    const mapping = mapColumns(headers);

    const existingKeys = new Set(existing.map(signatureKey));
    const seenInFile = new Set<string>();

    const rows: NutritionImportRow[] = [];
    const dataRows = parsed.data;

    for (let i = 0; i < dataRows.length; i++) {
        const raw = dataRows[i] ?? {};
        const get = (field: string): string | undefined => {
            const column = mapping[field];
            return column ? raw[column] : undefined;
        };

        const date = parseDate(get('date'));
        const mealType = parseMealType(get('mealType'));
        const name = (get('name') ?? '').trim() || null;
        const calories = parseNumber(get('calories'));

        const issues: string[] = [];
        if (!date) issues.push('Missing or invalid date');
        if (
            calories === null &&
            get('calories') !== undefined &&
            get('calories') !== ''
        ) {
            issues.push('Invalid calories value');
        }
        if (calories === null && name === null) {
            issues.push('Row has no food name or calories');
        }

        const sig: ExistingMealSignature = {
            date: date ?? '',
            mealType,
            calories,
        };
        const key = signatureKey(sig);
        const duplicate =
            date !== null && (existingKeys.has(key) || seenInFile.has(key));
        if (date !== null) seenInFile.add(key);

        rows.push({
            rowIndex: i + 1,
            date,
            mealType,
            name,
            calories,
            proteinGrams: parseNumber(get('protein')),
            carbsGrams: parseNumber(get('carbs')),
            fatGrams: parseNumber(get('fat')),
            fiberGrams: parseNumber(get('fiber')),
            sugarGrams: parseNumber(get('sugar')),
            sodiumMg: parseNumber(get('sodium')),
            issues,
            duplicate,
        });
    }

    const validRows = rows.filter(
        (r) => r.issues.length === 0 && !r.duplicate,
    ).length;
    const duplicateRows = rows.filter((r) => r.duplicate).length;
    const errorRows = rows.filter((r) => r.issues.length > 0).length;

    return {
        detectedColumns: Object.keys(mapping),
        detectedFormat: format,
        totalRows: rows.length,
        validRows,
        duplicateRows,
        errorRows,
        sample: rows.slice(0, 5),
        rows,
    };
}

/** Convert an importable (valid, non-duplicate) row into a meal entry payload. */
export function importRowToEntry(
    row: NutritionImportRow,
): BaseTrackingEntry | null {
    if (!row.date || row.issues.length > 0 || row.duplicate) return null;
    const metadata: Record<string, unknown> = { source: 'import' };
    if (row.mealType) metadata['mealType'] = row.mealType;
    if (row.name) metadata['description'] = row.name;
    if (row.calories !== null) metadata['calories'] = row.calories;
    if (row.proteinGrams !== null) metadata['protein'] = row.proteinGrams;
    if (row.carbsGrams !== null) metadata['carbs'] = row.carbsGrams;
    if (row.fatGrams !== null) metadata['fat'] = row.fatGrams;
    if (row.fiberGrams !== null) metadata['fiber'] = row.fiberGrams;
    const micros: Record<string, number> = {};
    if (row.sugarGrams !== null) micros['sugarGrams'] = row.sugarGrams;
    if (row.sodiumMg !== null) micros['sodiumMg'] = row.sodiumMg;
    if (Object.keys(micros).length > 0) metadata['micronutrients'] = micros;

    return {
        category: 'meal',
        entryDate: row.date,
        metadata,
        tags: ['import'],
        source: 'import',
    };
}
