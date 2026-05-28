/**
 * USDA FoodData Central provider.
 *
 * Requires an API key. Because food search runs client-side, the key must be
 * exposed as NEXT_PUBLIC_USDA_API_KEY. When the key is absent the provider
 * reports itself unavailable (isAvailable() === false) and the registry simply
 * skips it — no crashing, no error spam.
 *
 * To enable: add to .env.local
 *   NEXT_PUBLIC_USDA_API_KEY=your_fdc_key   # free key from https://fdc.nal.usda.gov/api-key-signup.html
 *
 * Docs: https://fdc.nal.usda.gov/api-guide.html
 */

import type { FoodSearchResult } from '../foodTypes';
import { FoodProviderError, type FoodProvider } from './types';

const BASE = 'https://api.nal.usda.gov/fdc/v1';
const REQUEST_TIMEOUT_MS = 8000;

function apiKey(): string | undefined {
    // NEXT_PUBLIC_* is inlined at build time; guard for non-Next contexts (tests).
    const key =
        typeof process !== 'undefined'
            ? process.env?.['NEXT_PUBLIC_USDA_API_KEY']
            : undefined;
    return key && key.trim().length > 0 ? key.trim() : undefined;
}

interface FdcNutrient {
    nutrientName?: string;
    nutrientNumber?: string;
    value?: number;
    unitName?: string;
}

interface FdcFood {
    fdcId?: number;
    description?: string;
    brandName?: string;
    brandOwner?: string;
    servingSize?: number;
    servingSizeUnit?: string;
    foodNutrients?: FdcNutrient[];
}

/** USDA nutrient numbers (FDC) for the macros we read. */
const NUTRIENT = {
    calories: '208',
    protein: '203',
    fat: '204',
    carbs: '205',
    fiber: '291',
    sugar: '269',
    sodium: '307',
} as const;

function nutrientValue(food: FdcFood, number: string): number | undefined {
    const n = (food.foodNutrients ?? []).find(
        (x) => x.nutrientNumber === number,
    );
    return typeof n?.value === 'number' && Number.isFinite(n.value)
        ? n.value
        : undefined;
}

export function mapFdcFood(food: FdcFood): FoodSearchResult | null {
    const name = (food.description ?? '').trim();
    if (!name) return null;

    const result: FoodSearchResult = {
        externalId: String(food.fdcId ?? name),
        provider: 'usda',
        name,
        servingSize: food.servingSize ?? 100,
        servingUnit: food.servingSizeUnit ?? 'g',
        calories: nutrientValue(food, NUTRIENT.calories) ?? 0,
        proteinGrams: nutrientValue(food, NUTRIENT.protein) ?? 0,
        carbsGrams: nutrientValue(food, NUTRIENT.carbs) ?? 0,
        fatGrams: nutrientValue(food, NUTRIENT.fat) ?? 0,
        verified: true,
    };
    const brand = food.brandName ?? food.brandOwner;
    if (brand) result.brand = brand.trim();
    const fiber = nutrientValue(food, NUTRIENT.fiber);
    if (fiber !== undefined) result.fiberGrams = fiber;
    const sugar = nutrientValue(food, NUTRIENT.sugar);
    if (sugar !== undefined) result.sugarGrams = sugar;
    const sodium = nutrientValue(food, NUTRIENT.sodium);
    if (sodium !== undefined) result.sodiumMg = sodium;

    return result;
}

async function fetchJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const res = await fetch(url, { signal: controller.signal });
        if (res.status === 429) {
            throw new FoodProviderError(
                'rate_limited',
                'USDA rate limit reached.',
            );
        }
        if (res.status === 403 || res.status === 401) {
            throw new FoodProviderError(
                'missing_api_key',
                'USDA API key is invalid or missing.',
            );
        }
        if (!res.ok) {
            throw new FoodProviderError(
                'network',
                `USDA request failed (${res.status}).`,
            );
        }
        return (await res.json()) as unknown;
    } catch (err) {
        if (err instanceof FoodProviderError) throw err;
        throw new FoodProviderError(
            'network',
            'Could not reach USDA FoodData Central.',
        );
    } finally {
        clearTimeout(timer);
    }
}

export const usdaProvider: FoodProvider = {
    name: 'usda',
    label: 'USDA',
    supportsBarcode: false,
    isAvailable: () => apiKey() !== undefined,

    async search(query: string): Promise<FoodSearchResult[]> {
        const key = apiKey();
        if (!key)
            throw new FoodProviderError(
                'missing_api_key',
                'USDA API key not configured.',
            );
        const q = query.trim();
        if (q.length < 2) return [];
        const url =
            `${BASE}/foods/search?api_key=${encodeURIComponent(key)}` +
            `&query=${encodeURIComponent(q)}&pageSize=20`;
        try {
            const data = (await fetchJson(url)) as { foods?: FdcFood[] };
            const foods = Array.isArray(data.foods) ? data.foods : [];
            return foods
                .map(mapFdcFood)
                .filter((r): r is FoodSearchResult => r !== null);
        } catch (err) {
            if (
                err instanceof FoodProviderError &&
                (err.code === 'rate_limited' || err.code === 'missing_api_key')
            ) {
                throw err;
            }
            return [];
        }
    },

    lookupBarcode(): Promise<FoodSearchResult | null> {
        // USDA FDC does not support barcode lookup.
        return Promise.resolve(null);
    },

    async getById(externalId: string): Promise<FoodSearchResult | null> {
        const key = apiKey();
        if (!key) return null;
        const url = `${BASE}/food/${encodeURIComponent(externalId)}?api_key=${encodeURIComponent(key)}`;
        try {
            const data = (await fetchJson(url)) as FdcFood;
            return mapFdcFood(data);
        } catch {
            return null;
        }
    },
};
