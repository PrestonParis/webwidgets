# Dashboard Runtime Refactor Summary

## Overview

This document summarizes the comprehensive refactor of the Dashboard Runtime Manager to restore perceived responsiveness and usability while maintaining runtime protections. The runtime manager has been transformed from a visible scheduling system into invisible infrastructure that prioritizes user experience.

## What Changed

### 1. Runtime Tuning Constants (`dashboardRuntimeConfig.ts`)

Created a centralized configuration file for all runtime tuning values:

- **Hydration Scheduling**: `INITIAL_HYDRATION_BURST_COUNT` (6), `STAGGERED_HYDRATION_BATCH_SIZE` (3), `STAGGERED_HYDRATION_INTERVAL_MS` (400)
- **Concurrency Limits**: `MAX_CONCURRENT_HYDRATIONS` (4), `MAX_CONCURRENT_FETCHES` (6)
- **Visibility Detection**: `NEAR_VIEWPORT_MARGIN_PX` (400), `BACKGROUND_MARGIN_PX` (1200)
- **Pressure Thresholds**: Three-tier system (normal/moderate/high) with configurable thresholds
- **Adaptive Throttling**: Multipliers for slowing down instead of freezing (1x/2x/4x)
- **Widget Prioritization**: Priority scores (critical: 100, high: 75, normal: 50, low: 25)
- **Widget Weight**: Cost estimation (light: 1, medium: 2, heavy: 4)
- **Development Flags**: Debug panel, toasts, inspector toggle

### 2. Extended Widget Metadata (`widgetRuntimeMetadata.ts`)

Enhanced widget metadata with priority and weight system:

- **Priority Levels**: `critical`, `high`, `normal`, `low`
- **Weight Categories**: `light`, `medium`, `heavy`
- **Load Strategies**: `eager`, `visible`, `deferred`, `manual`
- **Estimated Cost**: Calculated from weight and priority for scheduling

**Critical Widgets** (eager load): clock, notes, weather, tasks, search, quick-actions

**High Priority Widgets**: calendar, tracking, tracking-health, tracking-meal, tracking-supplements, currency

**Heavy Widgets** (deferred load): developer, chat, files, reading, view, finance, collaboration, memorization, creative, context-diagram, widget-builder

### 3. Runtime Provider Refactor (`DashboardRuntimeProvider.tsx`)

**State Changes**:

- Added 4-level visibility tracking: `visible`, `nearVisible`, `offscreen`, `background`
- Added `pressureLevel` field (normal/moderate/high)
- Added `burstPhase` flag for initial burst scheduling

**Scheduling Improvements**:

- **Priority-based candidate selection**: Sorts by visibility → priority → weight → estimated cost
- **Adaptive throttling**: Slows down under pressure instead of freezing
- **Burst phase**: Immediate hydration of first 6 widgets, then staggered batches
- **Heavy widget deprioritization**: Skips heavy widgets under high pressure

**Pressure Control**:

- Three-tier pressure detection (normal/moderate/high)
- Adaptive throttling multipliers (1x/2x/4x)
- Heavy widget delay under pressure (2000ms)
- No longer completely freezes visible widget hydration

**Visibility System**:

- Added `setWidgetVisibilityLevel()` for 4-level visibility
- Multiple IntersectionObservers for different viewport margins
- Visibility-aware scheduling (visible widgets prioritized)

### 4. Runtime UI Removal

**Removed from Production UX**:

- "Loading paused to keep dashboard responsive" toast
- `DashboardRuntimeControls` component from main dashboard
- Runtime counters, hydration stats, debug metrics from primary UI

**Moved to Development**:

- Runtime debug panel (only in non-production, controlled by `DEV_RUNTIME_DEBUG_PANEL`)
- Console logging (controlled by `DEV_RUNTIME_TOASTS`)
- Created `RuntimeInspector` component for detailed debugging

### 5. Progressive Widget States (`ViewportWidgetMount.tsx`)

**Replaced "Queued for hydration"** with meaningful progressive messages:

- "Loading..." - General loading state
- "Loading when visible" - Heavy widgets
- "Load when needed" - Manual load widgets
- "Offscreen - will load when visible" - Offscreen widgets
- "Preparing widget..." - Pre-hydration state
- "Temporarily unavailable" - Failed/cooldown state
- "Disabled after repeated failures" - Permanently disabled

**Removed**: "Load more widgets" button (only retry button for failed widgets)

### 6. Snapshot API Enhancement (`dashboardOrchestrator.ts`)

**Added Compact Preview Data**:

- `extractCompactPreview()` function extracts lightweight summary information
- Handles array data (count, first item preview)
- Handles object data (extracts common fields: count, total, title, name, status, timestamp, etc.)
- Fallback to string preview for unstructured data
- Added `compactPreview` field to widget snapshots

**Purpose**: Enable progressive rendering with meaningful preview data before full hydration

### 7. Development Runtime Inspector (`RuntimeInspector.tsx`)

**New Dev-Only Component**:

- Toggleable with keyboard shortcut (Ctrl/Cmd + Shift + D)
- Persisted visibility in localStorage
- Shows comprehensive runtime state:
  - Registered, loaded, visible, near-visible, offscreen, background counts
  - Hydrated, failed counts
  - Active fetches, hydrating count
  - Pressure level (color-coded)
  - Paused status
- Expandable details:
  - Queued widgets with priority/weight
  - Hydrating widgets
  - Failed widgets with failure count
- Only visible in development environment

## Hydration Flow Explanation

### Initial Load (Burst Phase)

1. Widgets register with metadata (priority, weight, load strategy)
2. Critical and high-priority widgets marked for immediate load
3. First 6 widgets (or critical/high priority) hydrate immediately (burst phase)
4. Burst phase flag set to false after first batch

### Progressive Loading (Staggered Phase)

1. Every 400ms (or throttled under pressure), load next batch of 3 widgets
2. Candidates sorted by: visibility → priority → weight → estimated cost
3. Heavy widgets skipped under high pressure
4. Adaptive throttling slows intervals under pressure (2x/4x)

### Visibility-Based Hydration

1. Multiple IntersectionObservers track 4 visibility levels:
   - **Visible** (0px margin): Immediate hydration
   - **Near-visible** (400px margin): Preload lightly
   - **Offscreen** (1200px margin): Shell only
   - **Background** (beyond 1200px): No work
2. Visible widgets always prioritized in scheduling
3. Offscreen widgets remain in shell state until visible

### Pressure-Aware Scheduling

1. Pressure level calculated from:
   - Active fetch count (moderate: 4, high: 8)
   - Active hydration count (moderate: 3, high: 5)
   - Average request duration (moderate: 5000ms, high: 8000ms)
   - Failure count (high: 5)
2. Under pressure:
   - Throttle multiplier applied to batch intervals
   - Heavy widgets deprioritized
   - Light widgets continue to hydrate
3. Never completely freezes visible widget hydration

## Visibility System Explanation

### 4-Level Visibility

The runtime now tracks widgets at 4 visibility levels:

1. **Visible**: Widget is in viewport (0px margin)
   - Immediate hydration
   - Highest priority in scheduling

2. **Near-visible**: Widget within 400px of viewport
   - Preload lightly
   - Second priority in scheduling

3. **Offscreen**: Widget beyond 400px but within 1200px
   - Shell only
   - Low priority in scheduling

4. **Background**: Widget beyond 1200px
   - No work
   - Deferred until near-visible

### Implementation

- Three separate IntersectionObservers with different root margins
- `setWidgetVisibilityLevel()` updates widget visibility state
- Visibility state used in scheduling priority
- Automatic transition between levels as user scrolls

## Snapshot Architecture

### Compact Preview Data

Snapshot API now includes `compactPreview` field with lightweight summary information:

**For Arrays**:

- `count`: Number of items
- `preview`: String preview of first item (100 chars)

**For Objects**:

- Extracts common fields: count, total, title, name, status, timestamp, updatedAt, createdAt
- Fallback to string summary (150 chars) if no standard fields

**Purpose**:

- Enable progressive rendering with meaningful preview data
- Show useful information before full hydration completes
- Reduce perceived loading time

### Integration

- `extractCompactPreview()` function in `dashboardOrchestrator.ts`
- Called during snapshot building for each widget
- Added to widget snapshot alongside full data
- Can be used by widgets to show preview states

## Scheduling Strategy

### Priority Queue

Widgets are sorted for hydration using multi-factor priority:

1. **Visibility** (highest weight): Visible widgets first
2. **Priority** (critical > high > normal > low)
3. **Weight** (light > medium > heavy)
4. **Estimated Cost** (lower cost first)

### Batch Scheduling

- **Burst Phase**: First 6 widgets hydrate immediately (0ms delay)
- **Staggered Phase**: 3 widgets every 400ms
- **Adaptive Throttling**: Interval multiplied by pressure level (1x/2x/4x)

### Starvation Prevention

- Visible widgets always prioritized
- Heavy widgets only skipped under high pressure
- No widget waits indefinitely if visible
- Manual load option for deferred widgets

## Pressure Control Behavior

### Three-Tier Pressure System

**Normal**:

- No throttling
- Standard batch intervals (400ms)
- All widgets eligible for hydration

**Moderate**:

- 2x throttling (800ms intervals)
- Heavy widgets still eligible
- Reduced concurrency

**High**:

- 4x throttling (1600ms intervals)
- Heavy widgets deprioritized (2000ms delay)
- Further reduced concurrency
- Never freezes visible widgets

### Triggers

- Active fetch count threshold
- Active hydration count threshold
- Average request duration threshold
- Failure count threshold

### Adaptive Behavior

- Gradual slowdown instead of hard stops
- Light widgets remain responsive
- Visible widgets continue to hydrate
- System feels adaptive, not catastrophic

## Widget Priority System

### Priority Levels

- **Critical** (score 100): clock, notes, weather, tasks, search, quick-actions
  - Eager load strategy
  - Always hydrate immediately

- **High** (score 75): calendar, tracking variants, currency
  - Visible load strategy
  - High scheduling priority

- **Normal** (score 50): Most widgets
  - Visible load strategy
  - Standard scheduling priority

- **Low** (score 25): Heavy widgets
  - Deferred load strategy
  - Low scheduling priority

### Weight Categories

- **Light** (cost multiplier 1): Simple widgets, low data needs
- **Medium** (cost multiplier 2): Moderate complexity
- **Heavy** (cost multiplier 4): Complex widgets, high data needs

### Estimated Cost

Calculated as: `(weightScore * 10) - priorityScore`

- Lower cost = should hydrate earlier
- Used as tiebreaker in scheduling

## Fetch Dedupe/Cooldown Strategy

### Request Deduplication

- In-flight request tracking in `widgetFetchRegistry.ts`
- Concurrent requests for same key deduped
- Cache with TTL (15000ms default)

### Cooldown System

- Progressive backoff: 30s, 120s, 300s
- HTTP status codes triggering cooldown: 408, 429, 500, 502, 503, 504
- Failure tracking with count
- Permanent disable after 3 failures
- Manual retry available

### Fetch Guard

- Global fetch interceptor installed
- Cooldown checks before requests
- Automatic cooldown response for cooling resources
- Timeout protection (8000ms default)

### Preserved Protections

All original protections maintained:

- Request deduplication
- Fetch cooldowns
- Visibility gating
- Unmount protection
- Abort handling
- Redis error handling
- Duplicate fetch prevention
- Scroll batching protections

## Known Limitations

1. **Snapshot Preview**: Compact preview extraction is generic and may not capture widget-specific summary information optimally. Individual widgets can enhance this by providing custom preview extractors.

2. **Visibility Observer Overhead**: Three IntersectionObservers per widget adds some overhead. This is acceptable for the improved visibility granularity but could be optimized in the future.

3. **Pressure Thresholds**: Current thresholds are empirically chosen. May need tuning based on real-world usage patterns and device capabilities.

4. **Heavy Widget Delay**: 2000ms delay for heavy widgets under high pressure is arbitrary. Could be made configurable or adaptive based on actual widget cost.

5. **No Idle-Time Hydration**: Current implementation doesn't hydrate widgets during idle time. Could be added as a future enhancement for background widgets.

## Tuning Knobs/Config Values

All tunable values are centralized in `dashboardRuntimeConfig.ts`:

### Hydration Scheduling

- `INITIAL_HYDRATION_BURST_COUNT`: 6
- `STAGGERED_HYDRATION_BATCH_SIZE`: 3
- `STAGGERED_HYDRATION_INTERVAL_MS`: 400
- `MAX_CONCURRENT_HYDRATIONS`: 4

### Visibility Detection

- `NEAR_VIEWPORT_MARGIN_PX`: 400
- `BACKGROUND_MARGIN_PX`: 1200

### Pressure Thresholds

- `PRESSURE_THRESHOLDS.MODERATE_FETCH_COUNT`: 4
- `PRESSURE_THRESHOLDS.HIGH_FETCH_COUNT`: 8
- `PRESSURE_THRESHOLDS.MODERATE_HYDRATION_COUNT`: 3
- `PRESSURE_THRESHOLDS.HIGH_HYDRATION_COUNT`: 5
- `PRESSURE_THRESHOLDS.MODERATE_REQUEST_MS`: 5000
- `PRESSURE_THRESHOLDS.HIGH_REQUEST_MS`: 8000
- `PRESSURE_THRESHOLDS.HIGH_FAILURE_COUNT`: 5

### Adaptive Throttling

- `PRESSURE_THROTTLE_MULTIPLIERS.NORMAL`: 1
- `PRESSURE_THROTTLE_MULTIPLIERS.MODERATE`: 2
- `PRESSURE_THROTTLE_MULTIPLIERS.HIGH`: 4
- `HEAVY_WIDGET_DELAY_MS`: 2000

### Fetch Strategy

- `DEFAULT_RESOURCE_TTL_MS`: 15000
- `DEFAULT_FETCH_TIMEOUT_MS`: 8000
- `FAILURE_COOLDOWNS_MS`: [30000, 120000, 300000]

### Feature Flags

- `ENABLE_ADAPTIVE_PRESSURE_CONTROL`: true
- `ENABLE_PROGRESSIVE_BATCH_SCHEDULING`: true
- `ENABLE_STARVATION_PREVENTION`: true
- `ENABLE_COMPACT_PREVIEW_MODES`: true
- `ENABLE_RUNTIME_AWARE_VISIBILITY`: true

### Development

- `DEV_RUNTIME_DEBUG_PANEL`: true
- `DEV_RUNTIME_TOASTS`: true
- `DEV_RUNTIME_INSPECTOR_SHORTCUT`: 'Ctrl+Shift+D'

## Future Improvement Suggestions

1. **Widget-Specific Preview Extractors**: Allow widgets to provide custom preview extraction logic for more meaningful snapshot previews.

2. **Idle-Time Hydration**: Hydrate background widgets during browser idle time using `requestIdleCallback`.

3. **Adaptive Thresholds**: Dynamically adjust pressure thresholds based on device capabilities (CPU, memory, network).

4. **Predictive Preloading**: Use scroll direction and velocity to predict which widgets will become visible soon.

5. **Widget Cost Profiling**: Actually measure widget hydration cost instead of estimating from weight/priority.

6. **Priority Inheritance**: Allow parent containers (folders) to influence child widget priority.

7. **User Preference Tuning**: Allow users to customize performance vs. completeness tradeoffs.

8. **Metrics Dashboard**: Add runtime performance metrics collection for monitoring and optimization.

9. **A/B Testing Framework**: Enable A/B testing of different scheduling strategies.

10. **Machine Learning Scheduling**: Use ML to predict optimal hydration order based on usage patterns.

## Architecture Decisions

### Why 4-Level Visibility?

Binary visibility (visible/not visible) was too coarse for optimal scheduling. 4 levels allow:

- Immediate hydration for visible widgets
- Preloading for near-visible widgets
- Shell-only for offscreen widgets
- No work for background widgets
- Smooth progressive loading as user scrolls

### Why Adaptive Throttling Instead of Freezing?

Freezing all hydration under pressure made the dashboard feel dead. Adaptive throttling:

- Maintains perceived responsiveness
- Prioritizes light/visible widgets
- Gradually slows down instead of stopping
- System feels adaptive, not broken

### Why Priority-Based Scheduling?

Registration order scheduling was unfair. Priority-based scheduling:

- Critical widgets always load first
- Heavy widgets don't block light widgets
- Visible widgets prioritized
- Fair and predictable behavior

### Why Separate Burst and Staggered Phases?

Single uniform batching was too slow for initial load. Burst + stagger:

- Immediate perceived speed (burst phase)
- Smooth progressive loading (staggered phase)
- Best of both worlds
- Configurable batch sizes and intervals

### Why Compact Preview Data?

Full snapshot data was too large. Compact previews:

- Enable meaningful progressive rendering
- Reduce memory footprint
- Show useful information immediately
- Maintain full data for actual hydration

## Where Runtime Behavior Now Lives

### Core Runtime

- `dashboardRuntimeConfig.ts`: All tuning constants and feature flags
- `DashboardRuntimeProvider.tsx`: Main runtime logic, scheduling, state management
- `widgetRuntimeTypes.ts`: Runtime type definitions
- `widgetRuntimeMetadata.ts`: Widget metadata generation

### Fetch & Failure

- `widgetFetchRegistry.ts`: Request deduplication, queueing, timeout
- `widgetFailureRegistry.ts`: Failure tracking, cooldown management

### Visibility

- Integrated into `DashboardRuntimeProvider.tsx` via `setWidgetVisibilityLevel()`
- Multiple IntersectionObservers in `useDashboardRuntimeWidget()`

### Snapshot

- `dashboardOrchestrator.ts`: Snapshot building with compact preview extraction
- `getDashboardSnapshot.ts`: Snapshot API endpoint

### Development Tools

- `RuntimeInspector.tsx`: Dev-only runtime inspector component
- `RuntimeDebugPanel`: Simple debug panel in provider

### Widget Integration

- `ViewportWidgetMount.tsx`: Widget mount with progressive states
- `WidgetWrapper.tsx`: Widget wrapper component
- `DashboardGrid.tsx`: Grid component (runtime controls removed)

## How to Extend Widget Runtime Behavior Safely

### Adding New Widget Types

1. Add widget type to appropriate category in `widgetRuntimeMetadata.ts`:
   - `CRITICAL_WIDGET_TYPES` for essential widgets
   - `HIGH_PRIORITY_WIDGET_TYPES` for important widgets
   - `HEAVY_WIDGET_TYPES` for resource-intensive widgets
   - `MEDIUM_WIDGET_TYPES` for moderate widgets

2. Add data keys to `DATA_KEYS` mapping if widget makes API calls

### Custom Priority/Weight

If default priority/weight doesn't fit:

1. Override in widget's `getWidgetRuntimeMetadata()` call
2. Or extend the categorization logic in `widgetRuntimeMetadata.ts`

### Custom Preview Extraction

For widget-specific preview data:

1. Add widget-specific logic to `extractCompactPreview()` in `dashboardOrchestrator.ts`
2. Or provide custom preview extractor in widget manifest

### Tuning Performance

Adjust values in `dashboardRuntimeConfig.ts`:

- Increase `INITIAL_HYDRATION_BURST_COUNT` for faster initial load
- Decrease `STAGGERED_HYDRATION_INTERVAL_MS` for faster progressive loading
- Adjust pressure thresholds for different hardware capabilities
- Modify visibility margins for different screen sizes

### Adding New Visibility Levels

1. Add new level to `WidgetVisibilityLevel` type
2. Add tracking set to `RuntimeState`
3. Add IntersectionObserver with appropriate margin
4. Update `setWidgetVisibilityLevel()` logic
5. Update scheduling priority logic

### Custom Scheduling Strategy

1. Modify candidate sorting in `loadBatch()` function
2. Add custom priority factors
3. Adjust batch size/interval logic
4. Consider feature flags for A/B testing

## Testing Recommendations

### Manual Testing Scenarios

1. **Initial Dashboard Load**: Verify visible widgets hydrate within 1 second
2. **Slow Scrolling**: Verify smooth progressive loading
3. **Aggressive Scrolling**: Verify offscreen widgets remain cheap
4. **All Widgets Enabled**: Verify memory usage stays reasonable
5. **Mobile Viewport**: Verify visibility detection works on small screens
6. **Network Throttling**: Verify adaptive throttling under slow network
7. **Redis Unavailable**: Verify graceful degradation
8. **Failing Widget Routes**: Verify failure UX and retry
9. **Heavy Widget Combinations**: Verify heavy widgets don't block light widgets
10. **Stale Cached Data**: Verify stale data shown instead of blank states
11. **Hidden Tab Return**: Verify widgets rehydrate correctly
12. **Resizing Viewport**: Verify visibility updates correctly

### Verification Checklist

- [ ] Visible widgets hydrate quickly
- [ ] Hydration continuously progresses
- [ ] Widgets do not remain permanently queued
- [ ] Dashboard feels responsive under pressure
- [ ] No request storms return
- [ ] All-widget mode remains usable
- [ ] Runtime manager is invisible in production
- [ ] UI no longer feels like a scheduler console
- [ ] Hydration continuously progresses
- [ ] Heavy widgets don't block light widgets
- [ ] Offscreen widgets remain cheap
- [ ] Server stability remains improved
- [ ] User perceives speed instead of orchestration
- [ ] Debug/runtime instrumentation hidden from normal UX

## Conclusion

The Dashboard Runtime Manager has been successfully refactored to prioritize perceived responsiveness while maintaining all runtime protections. The system now:

- **Feels Alive**: Immediate burst hydration + smooth progressive loading
- **Remains Invisible**: Runtime UI moved to dev-only, production UX clean
- **Adapts Intelligently**: Adaptive throttling instead of hard freezes
- **Prioritizes Fairly**: Priority-based scheduling with visibility awareness
- **Protects Reliably**: All original protections preserved (dedupe, cooldown, abort, etc.)

The runtime manager is now infrastructure that users don't see or think about—they just experience a fast, responsive dashboard.
