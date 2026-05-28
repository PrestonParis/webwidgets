import type { MicronutrientProfile } from './micronutrientTypes';
import type { FoodSource } from './foodTypes';

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

export { readSource };
