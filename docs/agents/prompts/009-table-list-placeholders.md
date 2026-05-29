# 009 - Table and List Placeholders

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: Low  

## Objective

Create standardized skeleton and placeholder patterns for data-heavy views like tables and lists.

## Context

Many widgets (Finance, Inbox, Habits) display lists or tables. During loading, these should have consistent skeleton states that match the final content's structure.

## Required Reading

- `features/ui/loading/TableLoading.tsx`
- `features/ui/loading/ListLoading.tsx`

## Required Searches

```bash
rg "Table" features
rg "List" features
```

## Implementation Requirements

1. **Refine Skeletons:** Ensure `TableLoading` and `ListLoading` are generic enough to be used across different features.
2. **Empty State Integration:** Ensure these components transition smoothly to `EmptyState` if no data is returned.
3. **Density Support:** Support different list/table densities (compact, normal, relaxed).

## Constraints

- Match the "Hypermodern" look—subtle animations, clean lines.

## Files Likely Affected

- `features/ui/loading/`
- `features/inbox/components/`
- `features/finance/components/`

## Validation

- Apply to the Inbox widget and Finance accounts list.
- Verify visual alignment between skeletons and real data.

## Completion Notes

Refined `features/ui/loading/TableLoading.tsx`: fixed bug where header row didn't use `gridTemplateColumns` (columns were stacked vertically), added `density` prop (compact/normal/relaxed) controlling padding. Refined `features/ui/loading/ListLoading.tsx`: replaced boolean `compact` with `density: ListDensity`, added `showMeta` prop to optionally suppress the secondary line, adjusted gap spacing per density. Both are already exported from `features/ui/loading/index.ts`.
