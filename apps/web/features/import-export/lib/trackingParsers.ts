/**
 * Tracking parser barrel — re-exports standalone import/export utilities from
 * the tracking feature so they are accessible from the import-export module boundary.
 *
 * The original files are NOT modified or deleted — they may be used directly by
 * tracking hooks and components. This barrel simply exposes them through the
 * import-export layer for use in adapters and the import pipeline.
 */

// ── CSV parsing ───────────────────────────────────────────────────────────────
export {
    detectDelimiter,
    parseCSV,
} from '@/features/tracking/lib/import/csvParser';

// ── Category mapping and metadata extraction ──────────────────────────────────
export {
    inferCategory,
    extractEntryDate,
    buildMetadata,
} from '@/features/tracking/lib/import/categoryMapper';

// ── Import validation ─────────────────────────────────────────────────────────
export { validateAndMap } from '@/features/tracking/lib/import/importValidator';

// ── Nutrition CSV export builders ─────────────────────────────────────────────
export {
    buildMealHistoryCsv,
    buildDailySummaryCsv,
    downloadCsv,
} from '@/features/tracking/lib/meal/nutrition/export';

// ── Supplement import/export ──────────────────────────────────────────────────
export {
    mapSupplementCsv,
    exportSupplementLogsCsv,
} from '@/features/tracking/lib/supplements/importExport';
