/**
 * Food provider abstraction.
 *
 * A FoodProvider is any source of food nutrition data: a manual fallback, a
 * text-search API (USDA/OFF), a barcode lookup, etc. Components never call
 * providers directly with provider-specific code — they depend on this
 * interface and on the registry in ./index.
 */

import type { FoodSearchResult } from '../types';

export interface FoodProvider {
    /** Stable identifier, also used as FoodSearchResult.provider. */
    readonly name: string;
    /** Human-readable label for UI ("USDA", "Open Food Facts", "Manual"). */
    readonly label: string;
    /** Whether this provider can run right now (e.g. API key present). */
    isAvailable(): boolean;
    /** Whether this provider supports barcode lookup. */
    readonly supportsBarcode: boolean;
    /** Text search. Should resolve to [] (not throw) on no results. */
    search(query: string): Promise<FoodSearchResult[]>;
    /** Barcode lookup. Resolves null when not found. */
    lookupBarcode(barcode: string): Promise<FoodSearchResult | null>;
    /** Fetch a single result by this provider's external id. */
    getById(externalId: string): Promise<FoodSearchResult | null>;
}

/** Error thrown by providers; carries a machine-readable code for the UI. */
export class FoodProviderError extends Error {
    constructor(
        public readonly code: FoodProviderErrorCode,
        message: string,
    ) {
        super(message);
        this.name = 'FoodProviderError';
    }
}

export type FoodProviderErrorCode =
    | 'unavailable'
    | 'missing_api_key'
    | 'rate_limited'
    | 'not_found'
    | 'network'
    | 'invalid_response';
