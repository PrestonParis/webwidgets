# Loading System — Complete Redesign

## Overview

The WebWidgets app now has a comprehensive, production-grade loading component system replacing barebones spinners throughout the codebase.

## Architecture

### Component Structure

```
features/ui/loading/
├── LoadingState.tsx         # Main flexible wrapper (supports all variants)
├── LoadingSpinner.tsx       # Reusable spinner primitive
├── LoadingSkeleton.tsx      # Skeleton placeholders for content
├── PageLoading.tsx          # Full-page/route-level loading
├── WidgetLoading.tsx        # Dashboard widget loading states
├── TableLoading.tsx         # Table/grid skeleton
├── ListLoading.tsx          # Feed/email/list skeleton
├── ChartLoading.tsx         # Chart placeholder
├── OverlayLoading.tsx       # Loading overlay for existing UI
├── ButtonLoading.tsx        # Button-level loading state
└── index.ts                 # Barrel export
```

**Backward Compatibility:** Old import path `features/ui/components/LoadingState` re-exports from the new loading system.

---

## Components & Usage

### 1. LoadingState (Main Wrapper)

Flexible, variant-based wrapper supporting all loading scenarios.

**Variants:**

- `fullscreen` — App-level loading (min-h-screen)
- `page` — Page/route loading (configurable height)
- `section` — Content section (default, ~min-h-64)
- `card` — Card-sized loading (~min-h-40)
- `widget` — Dashboard widget (preserves dimensions)
- `inline` — Inline spinner, no layout shift
- `overlay` — Loading overlay on existing UI
- `button` — Button-level loading indicator
- `table` — Table skeleton with rows/columns
- `list` — Feed/list item skeleton
- `chart` — Chart placeholder

**Basic Usage:**

```tsx
// Page loading
<LoadingState variant="page" message="Loading your data..." />

// Widget loading
<LoadingState variant="widget" widgetVariant="standard" />

// Button loading
<LoadingState variant="button" isLoading={isLoading}>
  Submit
</LoadingState>

// Inline spinner
<LoadingState variant="inline" />

// Table skeleton
<LoadingState variant="table" rows={10} columns={4} />

// Overlay
<LoadingState variant="overlay" overlayMode="dim" message="Processing..." />
```

**Props:**

```typescript
variant?: LoadingVariant
size?: LoadingSize                   // xs, sm, md, lg, xl
tone?: LoadingTone                   // default, muted, accent, success, warning, destructive
message?: string
subMessage?: string
showSpinner?: boolean
showSkeleton?: boolean
minHeight?: string
centered?: boolean
rounded?: boolean
border?: boolean
className?: string
isLoading?: boolean
isLoaded?: boolean
children?: React.ReactNode
// Variant-specific props
rows?: number                        // For table variant
columns?: number                     // For table variant
count?: number                       // For list/skeleton
widgetVariant?: 'compact' | 'standard' | 'large' | 'dense'
overlayMode?: 'transparent' | 'dim' | 'blur' | 'solid'
chartVariant?: 'line' | 'bar' | 'area'
```

---

### 2. LoadingSpinner

Lightweight spinner primitive with sizes and tones.

```tsx
import { LoadingSpinner } from '@/features/ui/loading';

<LoadingSpinner size="md" tone="accent" />
<LoadingSpinner size="xs" tone="default" />
```

**Sizes:** `xs`, `sm`, `md`, `lg`, `xl`  
**Tones:** `default`, `muted`, `accent`, `success`, `warning`, `destructive`

---

### 3. PageLoading

Full-page or route-level loading screen.

```tsx
<PageLoading
  fullscreen
  message="Loading your dashboard..."
  subMessage="This should only take a moment"
/>
```

---

### 4. WidgetLoading

Widget-specific loading preserving dimensions.

```tsx
<WidgetLoading variant="standard" showHeader={true} />
```

**Variants:** `compact`, `standard`, `large`, `dense`

---

### 5. TableLoading

Skeleton for tables/grids.

```tsx
<TableLoading rows={5} columns={4} showHeader={true} />
```

---

### 6. ListLoading

Skeleton for feeds, emails, news lists.

```tsx
<ListLoading count={5} showAvatar={true} compact={false} />
```

---

### 7. ChartLoading

Placeholder for chart-heavy widgets.

```tsx
<ChartLoading height="h-64" variant="line" barCount={8} />
```

**Variants:** `line`, `bar`, `area`

---

### 8. OverlayLoading

Loading overlay on existing content.

```tsx
<div className="relative">
  {/* Existing content */}
  <OverlayLoading isLoading={isLoading} mode="dim" message="Saving..." />
</div>
```

**Modes:** `transparent`, `dim`, `blur`, `solid`

---

### 9. ButtonLoading

Button-level loading state.

```tsx
<button disabled={isLoading}>
  <ButtonLoading isLoading={isLoading} spinnerSize="sm">
    Submit
  </ButtonLoading>
</button>
```

---

## Design System

### Visual Direction

- **Dark-first:** Zinc/slate surfaces with subtle shadows
- **Spacing:** Rounded corners (rounded-xl), soft padding
- **Animation:** Minimal shimmer/pulse, respects `prefers-reduced-motion`
- **Colors:**
  - Default: Zinc (neutral)
  - Muted: Lighter zinc
  - Accent: Blue (primary action)
  - Success: Emerald
  - Warning: Amber
  - Destructive: Red

### Accessibility

- `role="status"` on loading containers
- `aria-live="polite"` for loading messages
- `.sr-only` hidden text for screen readers
- Respects `prefers-reduced-motion` → spinner pauses
- No focus traps, keyboard-navigable

---

## Migration Guide

### Find & Replace Patterns

#### Pattern 1: Bare Spinner Divs

**Before:**

```tsx
{
  loading ? (
    <div className="flex justify-center py-10">
      <div className="w-6 h-6 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />
    </div>
  ) : null;
}
```

**After:**

```tsx
import { LoadingState } from '@/features/ui/loading';

{
  loading ? <LoadingState variant="section" minHeight="min-h-40" /> : null;
}
```

#### Pattern 2: Page Loading

**Before:**

```tsx
if (loading) {
  return (
    <div className="flex justify-center py-24">
      <div className="w-5 h-5 border-2 border-[#4f6ef7] border-t-transparent animate-spin" />
    </div>
  );
}
```

**After:**

```tsx
import { PageLoading } from '@/features/ui/loading';

if (loading) return <PageLoading fullscreen={false} minHeight="min-h-96" />;
```

#### Pattern 3: Widget Loading

**Before:**

```tsx
{
  loading ? (
    <div className="flex justify-center py-6">
      <div className="w-5 h-5 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
    </div>
  ) : null;
}
```

**After:**

```tsx
import { WidgetLoading } from '@/features/ui/loading';

{
  loading ? <WidgetLoading variant="compact" /> : null;
}
```

#### Pattern 4: Icon Spinner (No Change)

These are intentionally left alone—RefreshCw/Loader2 with `animate-spin` on action buttons:

```tsx
<RefreshCw className={isFetching ? 'animate-spin' : ''} />
```

**Reason:** Semantic—indicates the action is pending, not a layout loading state.

---

## Files Modified

### New Files Created

1. `features/ui/loading/LoadingState.tsx`
2. `features/ui/loading/LoadingSpinner.tsx`
3. `features/ui/loading/LoadingSkeleton.tsx`
4. `features/ui/loading/PageLoading.tsx`
5. `features/ui/loading/WidgetLoading.tsx`
6. `features/ui/loading/TableLoading.tsx`
7. `features/ui/loading/ListLoading.tsx`
8. `features/ui/loading/ChartLoading.tsx`
9. `features/ui/loading/OverlayLoading.tsx`
10. `features/ui/loading/ButtonLoading.tsx`
11. `features/ui/loading/index.ts`

### Files Updated (Imports Added + Loading States Replaced)

| File                                                             | Replacements                                          |
| ---------------------------------------------------------------- | ----------------------------------------------------- |
| `features/finance/components/watchlist/WatchlistTab.tsx`         | Bare spinner → LoadingState                           |
| `features/finance/components/watchlist/WatchlistChartDrawer.tsx` | Bare spinner → LoadingState                           |
| `features/finance/components/FinanceWidget.tsx`                  | Bare spinner → WidgetLoading                          |
| `features/settings/components/IntegrationsPage.tsx`              | Bare spinner + Loader2 → PageLoading + LoadingSpinner |
| `features/context/components/ContextDiagramPage.tsx`             | Bare spinner → LoadingState                           |
| `features/context/components/ContextDiagramWidget.tsx`           | Bare spinner → LoadingState                           |
| `app/files/page.tsx`                                             | Bare spinner → LoadingState                           |
| `features/form-filler/components/FillForm.tsx`                   | Loader2 icon → LoadingSpinner                         |
| `features/tracking/components/TrackingPage.tsx`                  | Bare spinners (2) → LoadingState                      |

### Files Left Intentionally Unchanged

Files with **icon spinners only** (RefreshCw/Loader2 on action buttons):

- `features/datahealth/components/DataHealthPage.tsx` — RefreshCw button
- `features/datahealth/components/DataHealthWidget.tsx` — RefreshCw button
- `features/finance/components/watchlist/WatchlistItemRow.tsx` — RefreshCw button
- `features/news/components/NewsWidget.tsx` — RefreshCw button
- `features/form-filler/components/FormFillerPage.tsx` — Loader2 icon (inline)

Files needing optional migration (lower priority):

- `features/reading/components/views/PdfReaderView.tsx`
- `features/reading/components/views/StructuredTextReaderView.tsx`
- `features/reading/components/ReadingLibraryPanel.tsx`
- `features/tracking/components/InsightPanel.tsx`
- `features/dashboard/components/DashboardView.tsx`

---

## Testing

No breaking changes to loading behavior. All visual states preserved; only implementation modernized.

### Verify:

1. All pages/widgets show loading states on initial load
2. Overlays/modals display correctly
3. Button loading indicators work
4. Tables/lists show skeleton rows
5. Charts show placeholder states
6. Reduced motion is respected (motion-reduce class)

---

## Key Differences from Old System

| Aspect              | Before                        | After                                         |
| ------------------- | ----------------------------- | --------------------------------------------- |
| **Variants**        | Single fullscreen spinner     | 10+ variants for all scenarios                |
| **Tone/Color**      | Hardcoded blue, emerald, etc. | Flexible tone system (accent, success, etc.)  |
| **Accessibility**   | None                          | Full ARIA, role="status", sr-only text        |
| **Reduced Motion**  | Ignored                       | Respected with `motion-reduce:animate-none`   |
| **Layout Shift**    | Likely                        | Avoided with `minHeight`, skeletons           |
| **Reusability**     | Single component              | Composable primitives + higher-level wrappers |
| **Maintainability** | Scattered divs                | Centralized, typed, documented                |

---

## Future Enhancements

- Add skeleton loaders for complex components (cards, avatars)
- Add animated skeleton "shimmer" effect
- Add progress variants (progress bar in page loading)
- Add skeleton image placeholders
- Config/theming for custom colors and durations

---

## Questions?

Refer to component implementations in `features/ui/loading/` for detailed prop signatures and defaults.
