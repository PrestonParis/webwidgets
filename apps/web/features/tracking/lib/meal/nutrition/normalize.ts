/**
 * Normalization helpers for nutrition data.
 *
 * Bridges the raw TrackingEntry.metadata shape (loosely-typed JSON) and the
 * strongly-typed nutrition domain. All readers are defensive: missing or
 * malformed fields degrade gracefully to undefined rather than throwing.
 */

import type { TrackingEntry } from '@/features/tracking/types/tracking';
import type {
    FoodItem,
    FoodSearchResult,
    FoodSource,
    MicronutrientProfile,
    NutritionTotals,
    MacroSplit,
} from './types';

// ─── primitive readers ──────────────────────────────────────────────────────

export function readNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        return value;
    }
    return undefined;
}

export function readString(value: unknown): string | undefined {
    if (typeof value === 'string' && value.trim().length > 0) return value;
    return undefined;
}

const MICRO_KEYS: (keyof MicronutrientProfile)[] = [
    'potassiumMg',
    'calciumMg',
    'ironMg',
    'vitaminDMcg',
    'vitaminCMg',
    'vitaminAMcg',
    'magnesiumMg',
    'cholesterolMg',
    'saturatedFatGrams',
    'transFatGrams',
    'sugarGrams',
    'sodiumMg',
];

/** Read a micronutrient profile from a loose object, keeping only valid numbers. */
export function readMicronutrients(
    value: unknown,
): Partial<MicronutrientProfile> | undefined {
    if (typeof value !== 'object' || value === null) return undefined;
    const obj = value as Record<string, unknown>;
    const out: Partial<MicronutrientProfile> = {};
    let found = false;
    for (const key of MICRO_KEYS) {
        const n = readNumber(obj[key]);
        if (n !== undefined) {
            out[key] = n;
            found = true;
        }
    }
    return found ? out : undefined;
}

const VALID_SOURCES: FoodSource[] = [
    'manual',
    'search',
    'barcode',
    'recipe',
    'template',
    'import',
];

function readSource(value: unknown): FoodSource {
    return typeof value === 'string' &&
        VALID_SOURCES.includes(value as FoodSource)
        ? (value as FoodSource)
        : 'manual';
}

// ─── food items from metadata ───────────────────────────────────────────────

/**
 * Read structured food items from an entry's metadata.items array, if present.
 * Returns [] when no structured items exist (legacy entries).
 */
export function readFoodItems(entry: TrackingEntry): FoodItem[] {
    const raw = entry.metadata['items'];
    if (!Array.isArray(raw)) return [];
    const items: FoodItem[] = [];
    for (let i = 0; i < raw.length; i++) {
        const item = normalizeFoodItem(raw[i], `${entry.id}-item-${i}`);
        if (item) items.push(item);
    }
    return items;
}

/** Normalize a single loose food-item object into a FoodItem. */
export function normalizeFoodItem(
    value: unknown,
    fallbackId: string,
): FoodItem | null {
    if (typeof value !== 'object' || value === null) return null;
    const o = value as Record<string, unknown>;
    const name = readString(o['name']);
    if (!name) return null;

    const quantity = readNumber(o['quantity']) ?? 1;
    const calories = readNumber(o['calories']) ?? 0;

    const item: FoodItem = {
        id: readString(o['id']) ?? fallbackId,
        name,
        quantity,
        servingSize: readNumber(o['servingSize']) ?? 1,
        servingUnit: readString(o['servingUnit']) ?? 'serving',
        calories,
        proteinGrams: readNumber(o['proteinGrams']) ?? 0,
        carbsGrams: readNumber(o['carbsGrams']) ?? 0,
        fatGrams: readNumber(o['fatGrams']) ?? 0,
        source: readSource(o['source']),
    };
    const brand = readString(o['brand']);
    if (brand) item.brand = brand;
    const fiber = readNumber(o['fiberGrams']);
    if (fiber !== undefined) item.fiberGrams = fiber;
    const sugar = readNumber(o['sugarGrams']);
    if (sugar !== undefined) item.sugarGrams = sugar;
    const sodium = readNumber(o['sodiumMg']);
    if (sodium !== undefined) item.sodiumMg = sodium;
    const micros = readMicronutrients(o['micronutrients']);
    if (micros) item.micronutrients = micros;
    const provider = readString(o['sourceProvider']);
    if (provider) item.sourceProvider = provider;
    const extId = readString(o['externalFoodId']);
    if (extId) item.externalFoodId = extId;
    const barcode = readString(o['barcode']);
    if (barcode) item.barcode = barcode;

    return item;
}

// ─── conversions ────────────────────────────────────────────────────────────

/** Build a FoodItem from a provider search result scaled by quantity. */
export function foodResultToItem(
    result: FoodSearchResult,
    quantity: number,
    id: string,
): FoodItem {
    const q = quantity > 0 ? quantity : 1;
    const item: FoodItem = {
        id,
        name: result.name,
        quantity: q,
        servingSize: result.servingSize,
        servingUnit: result.servingUnit,
        calories: round(result.calories * q),
        proteinGrams: round(result.proteinGrams * q),
        carbsGrams: round(result.carbsGrams * q),
        fatGrams: round(result.fatGrams * q),
        source: result.provider === 'manual' ? 'manual' : 'search',
        sourceProvider: result.provider,
        externalFoodId: result.externalId,
    };
    if (result.brand) item.brand = result.brand;
    if (result.fiberGrams !== undefined)
        item.fiberGrams = round(result.fiberGrams * q);
    if (result.sugarGrams !== undefined)
        item.sugarGrams = round(result.sugarGrams * q);
    if (result.sodiumMg !== undefined)
        item.sodiumMg = round(result.sodiumMg * q);
    if (result.micronutrients) {
        item.micronutrients = scaleMicronutrients(result.micronutrients, q);
    }
    return item;
}

/**
 * Build a meal-entry metadata object from a scaled food result. Used by the
 * food-search quick-log flow. Stores macros + a single structured item so the
 * meal can later be saved as a template.
 */
export function foodResultToMealMetadata(
    result: FoodSearchResult,
    opts: {
        quantity: number;
        mealType?: string;
        time?: string;
    },
): Record<string, unknown> {
    const item = foodResultToItem(result, opts.quantity, `food-${Date.now()}`);
    const metadata: Record<string, unknown> = {
        description: result.name + (result.brand ? ` (${result.brand})` : ''),
        calories: item.calories,
        protein: item.proteinGrams,
        carbs: item.carbsGrams,
        fat: item.fatGrams,
        servings: opts.quantity,
        servingQty: result.servingSize,
        servingUnit: result.servingUnit,
        source: result.provider === 'manual' ? 'manual' : 'search',
        sourceProvider: result.provider,
        externalFoodId: result.externalId,
        items: [foodItemToMetadata(item)],
    };
    if (item.fiberGrams !== undefined) metadata['fiber'] = item.fiberGrams;
    if (opts.mealType) metadata['mealType'] = opts.mealType;
    if (opts.time) metadata['time'] = opts.time;
    const micros: Record<string, number> = {};
    if (item.sugarGrams !== undefined) micros['sugarGrams'] = item.sugarGrams;
    if (item.sodiumMg !== undefined) micros['sodiumMg'] = item.sodiumMg;
    if (item.micronutrients) Object.assign(micros, item.micronutrients);
    if (Object.keys(micros).length > 0) metadata['micronutrients'] = micros;
    return metadata;
}

/** Serialize a FoodItem into a plain JSON-safe object for entry metadata. */
export function foodItemToMetadata(item: FoodItem): Record<string, unknown> {
    const out: Record<string, unknown> = {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        servingSize: item.servingSize,
        servingUnit: item.servingUnit,
        calories: item.calories,
        proteinGrams: item.proteinGrams,
        carbsGrams: item.carbsGrams,
        fatGrams: item.fatGrams,
        source: item.source,
    };
    if (item.brand) out['brand'] = item.brand;
    if (item.fiberGrams !== undefined) out['fiberGrams'] = item.fiberGrams;
    if (item.sugarGrams !== undefined) out['sugarGrams'] = item.sugarGrams;
    if (item.sodiumMg !== undefined) out['sodiumMg'] = item.sodiumMg;
    if (item.micronutrients) out['micronutrients'] = item.micronutrients;
    if (item.sourceProvider) out['sourceProvider'] = item.sourceProvider;
    if (item.externalFoodId) out['externalFoodId'] = item.externalFoodId;
    if (item.barcode) out['barcode'] = item.barcode;
    return out;
}

// ─── totals ─────────────────────────────────────────────────────────────────

export function emptyTotals(): NutritionTotals {
    return {
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        fiberGrams: 0,
        sugarGrams: 0,
        sodiumMg: 0,
    };
}

/** Sum nutrition across food items. */
export function sumFoodItems(items: FoodItem[]): NutritionTotals {
    const t = emptyTotals();
    for (const it of items) {
        t.calories += it.calories;
        t.proteinGrams += it.proteinGrams;
        t.carbsGrams += it.carbsGrams;
        t.fatGrams += it.fatGrams;
        t.fiberGrams += it.fiberGrams ?? 0;
        t.sugarGrams += it.sugarGrams ?? 0;
        t.sodiumMg += it.sodiumMg ?? 0;
    }
    return roundTotals(t);
}

/** Divide totals by a serving count (per-serving nutrition). */
export function divideTotals(
    totals: NutritionTotals,
    servings: number,
): NutritionTotals {
    const s = servings > 0 ? servings : 1;
    return roundTotals({
        calories: totals.calories / s,
        proteinGrams: totals.proteinGrams / s,
        carbsGrams: totals.carbsGrams / s,
        fatGrams: totals.fatGrams / s,
        fiberGrams: totals.fiberGrams / s,
        sugarGrams: totals.sugarGrams / s,
        sodiumMg: totals.sodiumMg / s,
    });
}

/** Scale totals by a multiplier (e.g. serving multiplier for saved meals). */
export function scaleTotals(
    totals: NutritionTotals,
    factor: number,
): NutritionTotals {
    const f = factor > 0 ? factor : 1;
    return roundTotals({
        calories: totals.calories * f,
        proteinGrams: totals.proteinGrams * f,
        carbsGrams: totals.carbsGrams * f,
        fatGrams: totals.fatGrams * f,
        fiberGrams: totals.fiberGrams * f,
        sugarGrams: totals.sugarGrams * f,
        sodiumMg: totals.sodiumMg * f,
    });
}

/**
 * Macro split as percentage of macro-derived calories.
 * Uses 4/4/9 kcal per gram for protein/carbs/fat. Returns zeros when there is
 * no macro data (avoids divide-by-zero).
 */
export function computeMacroSplit(totals: NutritionTotals): MacroSplit {
    const pCal = totals.proteinGrams * 4;
    const cCal = totals.carbsGrams * 4;
    const fCal = totals.fatGrams * 9;
    const denom = pCal + cCal + fCal;
    if (denom <= 0) return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
    return {
        proteinPct: Math.round((pCal / denom) * 100),
        carbsPct: Math.round((cCal / denom) * 100),
        fatPct: Math.round((fCal / denom) * 100),
    };
}

// ─── helpers ────────────────────────────────────────────────────────────────

function scaleMicronutrients(
    micros: Partial<MicronutrientProfile>,
    factor: number,
): Partial<MicronutrientProfile> {
    const out: Partial<MicronutrientProfile> = {};
    for (const [key, val] of Object.entries(micros)) {
        if (typeof val === 'number') {
            out[key as keyof MicronutrientProfile] = round(val * factor);
        }
    }
    return out;
}

function round(n: number): number {
    return Math.round(n * 10) / 10;
}

function roundTotals(t: NutritionTotals): NutritionTotals {
    return {
        calories: Math.round(t.calories),
        proteinGrams: round(t.proteinGrams),
        carbsGrams: round(t.carbsGrams),
        fatGrams: round(t.fatGrams),
        fiberGrams: round(t.fiberGrams),
        sugarGrams: round(t.sugarGrams),
        sodiumMg: Math.round(t.sodiumMg),
    };
}
