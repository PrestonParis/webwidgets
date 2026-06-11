# 001 - Standardize Loading System

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: High

## Objective

Standardize the usage of loading states across the entire WebWidgets application. Ensure every widget, page, and heavy action uses the established loading primitives in `features/ui/loading/`.

## Context

Consistency is key to a premium feel. Currently, different widgets may implement loading differently (or not at all). We have a robust set of loading components, but they need to be applied systematically.

## Required Reading

- `docs/blueprint/ARCHITECTURE.md`
- `docs/agents/workflow/GEMINI.md`
- `features/ui/loading/LoadingState.tsx`
- `features/ui/loading/WidgetLoading.tsx`

## Required Searches

```bash
rg "isLoading" --type tsx
rg "loading" --type tsx
rg "Skeleton" --type tsx
```

## Implementation Requirements

1. **Audit Widgets:** Review all 28+ widget types in `features/dashboard/lib/renderWidgetContent.tsx` and ensure they use `WidgetLoading` or `WidgetSkeleton` during data fetching.
2. **Standardize Page Loading:** Ensure `app/**/page.tsx` or their corresponding feature components use `PageLoading`.
3. **Button Loading:** Audit forms and action buttons to ensure `ButtonLoading` is used during async operations.
4. **Overlay Loading:** Use `OverlayLoading` for full-screen or full-widget blocking transitions (e.g., during a major settings save).
5. **Consistency Check:** Ensure `LoadingState.tsx` is the primary entry point for general loading logic if possible, or that it at least coordinates the sub-components.

## Constraints

- Do not create new loading spinners if `LoadingSpinner.tsx` suffices.
- Maintain the "Hypermodern UI" aesthetic—prefer skeletons over spinners where content layout is known.
- Do not run `npm run build`.

## Files Likely Affected

- `features/ui/loading/*`
- `features/dashboard/lib/renderWidgetContent.tsx`
- `features/widgets/components/WidgetShell.tsx`
- Numerous `page.tsx` files and feature components.

## Validation

- Visually inspect widgets with throttled network.
- Ensure no "flicker" of empty content before loading state triggers.
- Run targeted linting on affected files.

## Completion Notes

`features/ui/loading/` is fully built: `LoadingState`, `WidgetLoading`, `PageLoading`, `ButtonLoading`, `OverlayLoading`, `TableLoading`, `ListLoading`, `ChartLoading`, `LoadingSpinner`, `LoadingSkeleton` — all exported from `index.ts`. `features/ui/components/LoadingState.tsx` re-exports for backward compat. All 28 widgets in `renderWidgetContent.tsx` are wrapped in `<Suspense fallback={<WidgetSkeleton />}>` for bundle loading. Key widgets (finance, context, tracking, mood) use `WidgetLoading` / `LoadingState` for data-fetch loading. Some widgets (weather, chess) retain feature-specific skeletons that match their layout — acceptable.
