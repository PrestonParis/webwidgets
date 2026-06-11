# 002 - Empty and Error State Consolidation

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: High

## Objective

Create and implement a unified system for empty and error states across all widgets and pages.

## Context

Widgets often fail to fetch data or have no data to show. Currently, these states are often handled ad-hoc. We need a consistent "WebWidgets" way to say "Nothing here yet" or "Something went wrong".

## Required Reading

- `docs/blueprint/VISION.md`
- `features/ui/loading/LoadingState.tsx` (for reference on state patterns)

## Required Searches

```bash
rg "EmptyState"
rg "ErrorState"
rg "no data"
rg "failed to fetch"
```

## Implementation Requirements

1. **Create Primitives:** If they don't exist, create `EmptyState.tsx` and `ErrorState.tsx` in `features/ui/components/`.
2. **Design Standards:**
   - `EmptyState`: Should include an icon, a clear title, a helpful description, and optionally a "Call to Action" button (e.g., "Add Item").
   - `ErrorState`: Should include an error icon, a "Something went wrong" message, a "Retry" button, and optionally a "Report Issue" link.
3. **Integration:** Integrate these into the `WidgetShell` or provide a standard hook/pattern for widgets to use them.
4. **Customization:** Allow widgets to pass custom icons or messages to these states while maintaining the structural layout.

## Constraints

- Follow the feature-based architecture.
- Ensure the UI matches the "Hypermodern" vision—clean, well-spaced, and helpful.

## Files Likely Affected

- `features/ui/components/` (New files)
- `features/widgets/components/WidgetShell.tsx`
- All widget implementation files in `features/*/components/`.

## Validation

- Mock failed API responses to trigger Error States.
- Clear data to trigger Empty States.
- Verify "Retry" functionality works as expected.

## Completion Notes

Created `features/ui/components/EmptyState.tsx` — icon + title + description + optional CTA button, three sizes (sm/md/lg), defaults to `InboxIcon`. Created `features/ui/components/ErrorState.tsx` — red icon + title + message + optional retry button with refresh icon. Both use `cn()` from `lib/utils/utils` and support dark mode via Tailwind `dark:` classes.
