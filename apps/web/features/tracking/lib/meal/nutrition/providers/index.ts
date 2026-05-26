/**
 * Food provider registry + session-cached search/barcode facade.
 *
 * Components call the exported helpers (searchFoods, lookupBarcode) rather than
 * touching individual providers. The registry:
 *   - filters to available providers (skips USDA when no key, etc.)
 *   - de-dupes/merges results across providers
 *   - caches results in a session-level Map to avoid re-hitting APIs
 */

import type { FoodSearchResult } from '../types';
import { NUTRITION_FLAGS } from '../../featureFlags';
import { FoodProviderError, type FoodProvider } from './types';
import { manualProvider } from './manualProvider';
import { openFoodFactsProvider } from './openFoodFactsProvider';
import { usdaProvider } from './usdaProvider';

export { FoodProviderError } from './types';
export type { FoodProvider, FoodProviderErrorCode } from './types';

/** Ordered list of all known providers (manual last as fallback). */
const ALL_PROVIDERS: FoodProvider[] = [
    usdaProvider,
    openFoodFactsProvider,
    manualProvider,
];

/** Providers that can actually run right now. */
export function availableProviders(): FoodProvider[] {
    return ALL_PROVIDERS.filter((p) => p.isAvailable());
}

export function availableSearchProviders(): FoodProvider[] {
    return availableProviders().filter((p) => p.name !== 'manual');
}

export function barcodeProviders(): FoodProvider[] {
    return availableProviders().filter((p) => p.supportsBarcode);
}

// ─── session cache ──────────────────────────────────────────────────────────

const searchCache = new Map<string, FoodSearchResult[]>();
const barcodeCache = new Map<string, FoodSearchResult | null>();

/** Clear caches (exposed for tests / manual refresh). */
export function clearFoodCache(): void {
    searchCache.clear();
    barcodeCache.clear();
}

// ─── search ─────────────────────────────────────────────────────────────────

export interface FoodSearchOutcome {
    results: FoodSearchResult[];
    /** providers that errored (e.g. rate-limited) for surfacing in the UI */
    errors: { provider: string; code: string; message: string }[];
}

/**
 * Search across all available search providers. Results are cached per query.
 * Never throws — provider failures are collected into `errors`.
 */
export async function searchFoods(query: string): Promise<FoodSearchOutcome> {
    const q = query.trim().toLowerCase();
    if (!NUTRITION_FLAGS.foodSearch || q.length < 2) {
        return { results: [], errors: [] };
    }
    const cached = searchCache.get(q);
    if (cached) return { results: cached, errors: [] };

    const providers = availableSearchProviders();
    const errors: FoodSearchOutcome['errors'] = [];
    const all: FoodSearchResult[] = [];

    const settled = await Promise.allSettled(
        providers.map((p) => p.search(query)),
    );
    settled.forEach((res, i) => {
        const provider = providers[i]!;
        if (res.status === 'fulfilled') {
            all.push(...res.value);
        } else {
            const err = res.reason;
            errors.push({
                provider: provider.name,
                code: err instanceof FoodProviderError ? err.code : 'network',
                message: err instanceof Error ? err.message : 'Search failed.',
            });
        }
    });

    const merged = dedupeResults(all);
    searchCache.set(q, merged);
    return { results: merged, errors };
}

// ─── barcode ────────────────────────────────────────────────────────────────

export interface BarcodeOutcome {
    result: FoodSearchResult | null;
    /** populated when the barcode matched more than one provider */
    alternatives: FoodSearchResult[];
    error: { code: string; message: string } | null;
}

/**
 * Look up a barcode across barcode-capable providers. Returns the first match
 * plus any alternatives, or a typed error for not-found / invalid / network.
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeOutcome> {
    const code = barcode.trim().replace(/\s/g, '');
    if (!NUTRITION_FLAGS.barcodeScan) {
        return {
            result: null,
            alternatives: [],
            error: {
                code: 'unavailable',
                message: 'Barcode lookup is disabled.',
            },
        };
    }
    if (!/^\d{6,14}$/.test(code)) {
        return {
            result: null,
            alternatives: [],
            error: {
                code: 'invalid',
                message: 'Enter a valid 6–14 digit barcode.',
            },
        };
    }
    if (barcodeCache.has(code)) {
        const cached = barcodeCache.get(code) ?? null;
        return {
            result: cached,
            alternatives: [],
            error: cached
                ? null
                : {
                      code: 'not_found',
                      message: 'No product found for this barcode.',
                  },
        };
    }

    const providers = barcodeProviders();
    if (providers.length === 0) {
        return {
            result: null,
            alternatives: [],
            error: {
                code: 'unavailable',
                message: 'No barcode providers available.',
            },
        };
    }

    const matches: FoodSearchResult[] = [];
    let lastError: { code: string; message: string } | null = null;

    for (const p of providers) {
        try {
            const r = await p.lookupBarcode(code);
            if (r) matches.push(r);
        } catch (err) {
            lastError = {
                code: err instanceof FoodProviderError ? err.code : 'network',
                message: err instanceof Error ? err.message : 'Lookup failed.',
            };
        }
    }

    if (matches.length === 0) {
        barcodeCache.set(code, null);
        return {
            result: null,
            alternatives: [],
            error: lastError ?? {
                code: 'not_found',
                message: 'No product found for this barcode.',
            },
        };
    }

    const [first, ...rest] = matches;
    barcodeCache.set(code, first!);
    return { result: first!, alternatives: rest, error: null };
}

// ─── helpers ────────────────────────────────────────────────────────────────

/** Merge results, preferring verified entries and dropping near-duplicates. */
export function dedupeResults(results: FoodSearchResult[]): FoodSearchResult[] {
    const seen = new Map<string, FoodSearchResult>();
    for (const r of results) {
        const key = `${r.name.toLowerCase()}|${(r.brand ?? '').toLowerCase()}`;
        const existing = seen.get(key);
        if (!existing || (!existing.verified && r.verified)) {
            seen.set(key, r);
        }
    }
    return Array.from(seen.values());
}
