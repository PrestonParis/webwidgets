/**
 * Manual fallback provider.
 *
 * Always available. Search/barcode never return remote results — instead the
 * UI uses this provider to construct a "blank" food the user fills in by hand,
 * guaranteeing logging always works even with no network or API keys.
 */

import type { FoodSearchResult } from '../types';
import type { FoodProvider } from './types';

export const MANUAL_PROVIDER_NAME = 'manual';

/** Build a blank manual food result the user can edit. */
export function makeManualResult(
    name = '',
    overrides: Partial<FoodSearchResult> = {},
): FoodSearchResult {
    return {
        externalId: `manual-${Date.now()}`,
        provider: MANUAL_PROVIDER_NAME,
        name,
        servingSize: 1,
        servingUnit: 'serving',
        calories: 0,
        proteinGrams: 0,
        carbsGrams: 0,
        fatGrams: 0,
        verified: false,
        ...overrides,
    };
}

export const manualProvider: FoodProvider = {
    name: MANUAL_PROVIDER_NAME,
    label: 'Manual',
    supportsBarcode: false,
    isAvailable: () => true,
    async search() {
        // Manual provider returns no search results; the UI offers "Add manually".
        return [];
    },
    async lookupBarcode() {
        return null;
    },
    async getById() {
        return null;
    },
};
