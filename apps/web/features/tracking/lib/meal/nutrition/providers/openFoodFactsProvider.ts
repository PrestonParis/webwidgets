/**
 * Open Food Facts provider.
 *
 * Free, no API key required. Provides both branded-food text search and barcode
 * lookup. Network calls are defensive — failures resolve to [] / null rather
 * than throwing, except where a typed FoodProviderError is more useful.
 *
 * Docs:
 *   barcode: https://world.openfoodfacts.org/api/v2/product/{barcode}.json
 *   search:  https://world.openfoodfacts.org/cgi/search.pl
 */

import type { FoodSearchResult, MicronutrientProfile } from '../types';
import { FoodProviderError, type FoodProvider } from './types';

const BASE = 'https://world.openfoodfacts.org';
const SEARCH_FIELDS =
    'code,product_name,brands,serving_quantity,serving_size,nutriments,nutrition_data_per';
const REQUEST_TIMEOUT_MS = 8000;

interface OffNutriments {
    [key: string]: number | string | undefined;
}

interface OffProduct {
    code?: string;
    product_name?: string;
    brands?: string;
    serving_quantity?: number | string;
    serving_size?: string;
    nutriments?: OffNutriments;
    nutrition_data_per?: string;
}

function num(value: unknown): number | undefined {
    const n = typeof value === 'string' ? parseFloat(value) : value;
    return typeof n === 'number' && Number.isFinite(n) && n >= 0
        ? n
        : undefined;
}

async function fetchJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (res.status === 429) {
            throw new FoodProviderError(
                'rate_limited',
                'Open Food Facts rate limit reached.',
            );
        }
        if (!res.ok) {
            throw new FoodProviderError(
                'network',
                `Open Food Facts request failed (${res.status}).`,
            );
        }
        return (await res.json()) as unknown;
    } catch (err) {
        if (err instanceof FoodProviderError) throw err;
        throw new FoodProviderError(
            'network',
            'Could not reach Open Food Facts.',
        );
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Map an OFF product to our normalized FoodSearchResult.
 * Prefers per-serving values; falls back to per-100g when serving data missing.
 */
export function mapOffProduct(product: OffProduct): FoodSearchResult | null {
    const name = (product.product_name ?? '').trim();
    if (!name) return null;

    const nutr = product.nutriments ?? {};
    const perServing = product.nutrition_data_per === 'serving';

    // OFF stores both `<key>_serving` and `<key>_100g` for many fields.
    const pick = (key: string): number | undefined => {
        if (perServing) {
            return num(nutr[`${key}_serving`]) ?? num(nutr[`${key}_100g`]);
        }
        return num(nutr[`${key}_serving`]) ?? num(nutr[`${key}_100g`]);
    };

    const calories =
        pick('energy-kcal') ??
        (pick('energy') !== undefined
            ? Math.round((pick('energy') as number) / 4.184)
            : undefined) ??
        0;

    const servingSize = num(product.serving_quantity) ?? 100;
    const servingUnit = product.serving_size?.replace(/[\d.\s]/g, '') || 'g';

    const micros: Partial<MicronutrientProfile> = {};
    const setMicro = (k: keyof MicronutrientProfile, v: number | undefined) => {
        if (v !== undefined) micros[k] = v;
    };
    setMicro('sugarGrams', pick('sugars'));
    setMicro(
        'sodiumMg',
        pick('sodium') !== undefined
            ? pick('sodium')! * 1000
            : pick('salt') !== undefined
              ? (pick('salt') as number) * 400
              : undefined,
    );
    setMicro('saturatedFatGrams', pick('saturated-fat'));
    setMicro(
        'calciumMg',
        pick('calcium') !== undefined
            ? (pick('calcium') as number) * 1000
            : undefined,
    );
    setMicro(
        'ironMg',
        pick('iron') !== undefined
            ? (pick('iron') as number) * 1000
            : undefined,
    );
    setMicro(
        'potassiumMg',
        pick('potassium') !== undefined
            ? (pick('potassium') as number) * 1000
            : undefined,
    );

    const result: FoodSearchResult = {
        externalId: product.code ?? `off-${name}`,
        provider: 'open_food_facts',
        name,
        servingSize,
        servingUnit,
        calories,
        proteinGrams: pick('proteins') ?? 0,
        carbsGrams: pick('carbohydrates') ?? 0,
        fatGrams: pick('fat') ?? 0,
        verified: true,
    };
    const brand = product.brands?.split(',')[0]?.trim();
    if (brand) result.brand = brand;
    const fiber = pick('fiber');
    if (fiber !== undefined) result.fiberGrams = fiber;
    if (micros.sugarGrams !== undefined) result.sugarGrams = micros.sugarGrams;
    if (micros.sodiumMg !== undefined)
        result.sodiumMg = Math.round(micros.sodiumMg);
    if (Object.keys(micros).length > 0) result.micronutrients = micros;

    return result;
}

export const openFoodFactsProvider: FoodProvider = {
    name: 'open_food_facts',
    label: 'Open Food Facts',
    supportsBarcode: true,
    isAvailable: () => true,

    async search(query: string): Promise<FoodSearchResult[]> {
        const q = query.trim();
        if (q.length < 2) return [];
        const url =
            `${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}` +
            `&search_simple=1&action=process&json=1&page_size=20&fields=${SEARCH_FIELDS}`;
        try {
            const data = (await fetchJson(url)) as { products?: OffProduct[] };
            const products = Array.isArray(data.products) ? data.products : [];
            return products
                .map(mapOffProduct)
                .filter((r): r is FoodSearchResult => r !== null);
        } catch (err) {
            if (
                err instanceof FoodProviderError &&
                err.code === 'rate_limited'
            ) {
                throw err;
            }
            return [];
        }
    },

    async lookupBarcode(barcode: string): Promise<FoodSearchResult | null> {
        const code = barcode.trim().replace(/\s/g, '');
        if (!/^\d{6,14}$/.test(code)) {
            throw new FoodProviderError(
                'invalid_response',
                'Barcode must be 6–14 digits.',
            );
        }
        const url = `${BASE}/api/v2/product/${code}.json?fields=${SEARCH_FIELDS}`;
        const data = (await fetchJson(url)) as {
            status?: number;
            product?: OffProduct;
        };
        if (data.status !== 1 || !data.product) return null;
        return mapOffProduct(data.product);
    },

    async getById(externalId: string): Promise<FoodSearchResult | null> {
        // For OFF, external id is the barcode.
        if (/^\d{6,14}$/.test(externalId)) {
            return this.lookupBarcode(externalId);
        }
        return null;
    },
};
