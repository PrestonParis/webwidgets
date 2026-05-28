/**
 * Dashboard Runtime Configuration
 *
 * Centralized tuning constants for the dashboard runtime manager.
 * These values control hydration behavior, scheduling, visibility detection,
 * pressure thresholds, and fetch strategies.
 *
 * Design goals:
 * - Aggressive internal protection (prevent crashes, request storms)
 * - Aggressive external responsiveness (perceived speed, progressive loading)
 * - Runtime manager should be invisible infrastructure to users
 */

// ─── Hydration Scheduling ──────────────────────────────────────────────────────

/**
 * Number of widgets to hydrate immediately on first load (burst phase)
 * These are the first-viewport critical widgets that should appear instantly
 */
export const INITIAL_HYDRATION_BURST_COUNT = 6;

/**
 * Number of widgets to hydrate in each subsequent staggered batch
 * Smaller batches create smoother progressive loading feel
 */
export const STAGGERED_HYDRATION_BATCH_SIZE = 3;

/**
 * Delay between staggered hydration batches in milliseconds
 * Creates smooth progressive loading instead of giant pauses
 */
export const STAGGERED_HYDRATION_INTERVAL_MS = 400;

/**
 * Maximum number of widgets hydrating concurrently
 * Prevents overwhelming the browser and server
 */
export const MAX_CONCURRENT_HYDRATIONS = 4;

/**
 * Maximum number of active fetches across all widgets
 * Prevents request storms
 */
export const MAX_CONCURRENT_FETCHES = 6;

// ─── Visibility Detection ─────────────────────────────────────────────────────

/**
 * Root margin for IntersectionObserver in pixels
 * 'visible': widget is in viewport
 * 'near-visible': widget is within this margin of viewport (preload lightly)
 * 'offscreen': widget is beyond this margin (shell only)
 */
export const NEAR_VIEWPORT_MARGIN_PX = 400;

/**
 * Root margin for background detection in pixels
 * Widgets beyond this margin are considered 'background' (no work)
 */
export const BACKGROUND_MARGIN_PX = 1200;

// ─── Runtime Pressure Thresholds ───────────────────────────────────────────────

/**
 * Thresholds for adaptive pressure control
 * Instead of freezing, we progressively slow down
 */
export const PRESSURE_THRESHOLDS = {
    /**
     * Number of active fetches that triggers 'moderate' pressure
     */
    MODERATE_FETCH_COUNT: 4,

    /**
     * Number of active fetches that triggers 'high' pressure
     */
    HIGH_FETCH_COUNT: 8,

    /**
     * Number of concurrent hydrations that triggers 'moderate' pressure
     */
    MODERATE_HYDRATION_COUNT: 3,

    /**
     * Number of concurrent hydrations that triggers 'high' pressure
     */
    HIGH_HYDRATION_COUNT: 5,

    /**
     * Average request duration (ms) that triggers 'moderate' pressure
     */
    MODERATE_REQUEST_MS: 5000,

    /**
     * Average request duration (ms) that triggers 'high' pressure
     */
    HIGH_REQUEST_MS: 8000,

    /**
     * Number of failed/cooled-down widgets that triggers pressure
     */
    HIGH_FAILURE_COUNT: 5,
} as const;

// ─── Adaptive Throttling ───────────────────────────────────────────────────────

/**
 * Multipliers for hydration interval under different pressure levels
 * Instead of stopping, we slow down progressively
 */
export const PRESSURE_THROTTLE_MULTIPLIERS = {
    /**
     * Normal operation: no throttling
     */
    NORMAL: 1,

    /**
     * Moderate pressure: slow down by 2x
     */
    MODERATE: 2,

    /**
     * High pressure: slow down by 4x
     */
    HIGH: 4,
} as const;

/**
 * Delay for heavy widgets under high pressure (ms)
 * Heavy widgets are deprioritized when system is under pressure
 */
export const HEAVY_WIDGET_DELAY_MS = 2000;

// ─── Widget Prioritization ─────────────────────────────────────────────────────

/**
 * Priority levels for widget hydration
 * Higher priority widgets hydrate first
 */
export type WidgetPriority = 'critical' | 'high' | 'normal' | 'low';

/**
 * Weight categories for widget cost estimation
 * Used for scheduling decisions
 */
export type WidgetWeight = 'light' | 'medium' | 'heavy';

/**
 * Default load strategies for widgets
 */
export type WidgetLoadStrategy = 'eager' | 'visible' | 'deferred' | 'manual';

/**
 * Priority scores for scheduling (higher = more important)
 */
export const PRIORITY_SCORES: Record<WidgetPriority, number> = {
    critical: 100,
    high: 75,
    normal: 50,
    low: 25,
} as const;

/**
 * Weight scores for cost estimation (higher = more expensive)
 */
export const WEIGHT_SCORES: Record<WidgetWeight, number> = {
    light: 1,
    medium: 2,
    heavy: 4,
} as const;

// ─── Fetch Strategy ────────────────────────────────────────────────────────────

/**
 * Default TTL for widget resource cache in milliseconds
 */
export const DEFAULT_RESOURCE_TTL_MS = 15000;

/**
 * Default timeout for widget fetches in milliseconds
 */
export const DEFAULT_FETCH_TIMEOUT_MS = 8000;

/**
 * Cooldown durations for failed requests (progressive backoff)
 * After N failures, cooldown for duration[N-1]
 */
export const FAILURE_COOLDOWNS_MS = [30000, 120000, 300000] as const;

/**
 * HTTP status codes that trigger cooldown
 */
export const COOLDOWN_STATUS_CODES = [408, 429, 500, 502, 503, 504] as const;

// ─── Snapshot Configuration ─────────────────────────────────────────────────────

/**
 * TTL for dashboard snapshot data in milliseconds
 */
export const SNAPSHOT_TTL_MS = 10000;

/**
 * Whether to enable snapshot-driven progressive rendering
 */
export const SNAPSHOT_DRIVEN_RENDERING = true;

// ─── Scheduler Configuration ────────────────────────────────────────────────────

/**
 * Maximum time a widget can wait in queue before being force-promoted (ms)
 * Prevents starvation
 */
export const MAX_QUEUE_WAIT_MS = 10000;

/**
 * Interval for checking queue starvation (ms)
 */
export const STARVATION_CHECK_INTERVAL_MS = 2000;

/**
 * Maximum retry attempts for failed widgets before permanent disable
 */
export const MAX_RETRY_ATTEMPTS = 3;

// ─── Development Mode ──────────────────────────────────────────────────────────

/**
 * Whether to show runtime debug panel in development
 */
export const DEV_RUNTIME_DEBUG_PANEL = true;

/**
 * Whether to show runtime toast notifications in development
 */
export const DEV_RUNTIME_TOASTS = true;

/**
 * Keyboard shortcut to toggle runtime inspector (Ctrl/Cmd + Shift + D)
 */
export const DEV_RUNTIME_INSPECTOR_SHORTCUT = 'Ctrl+Shift+D';

/**
 * LocalStorage key for runtime inspector visibility
 */
export const DEV_RUNTIME_INSPECTOR_STORAGE_KEY =
    'dashboard-runtime-inspector-visible';

// ─── Feature Flags ─────────────────────────────────────────────────────────────

/**
 * Enable compact widget preview modes
 */
export const ENABLE_COMPACT_PREVIEW_MODES = true;

/**
 * Enable runtime-aware visibility system (4-level visibility)
 */
export const ENABLE_RUNTIME_AWARE_VISIBILITY = true;

/**
 * Enable adaptive pressure control (throttle instead of freeze)
 */
export const ENABLE_ADAPTIVE_PRESSURE_CONTROL = true;

/**
 * Enable progressive batch scheduling
 */
export const ENABLE_PROGRESSIVE_BATCH_SCHEDULING = true;

/**
 * Enable starvation prevention in scheduler
 */
export const ENABLE_STARVATION_PREVENTION = true;
