# 003 - Widget Shell and Header Refinement

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: Medium  

## Objective

Refine the `WidgetShell` and `WidgetHeader` components to ensure they are robust, reusable, and support all planned Stage 1 features (pinning, mobility, menus).

## Context

The `WidgetShell` is the most important primitive in the app. It manages the lifecycle, styling, and basic interaction of every widget. `WidgetHeader` handles titles, actions, and menus.

## Required Reading

- `features/widgets/components/WidgetShell.tsx`
- `features/widgets/components/WidgetHeader.tsx`
- `docs/blueprint/ARCHITECTURE.md` (Widget System section)

## Required Searches

```bash
rg "WidgetShell"
rg "WidgetHeader"
```

## Implementation Requirements

1. **Header Standardization:** Ensure `WidgetHeader` supports:
   - Dynamic titles.
   - Status indicators (active, dormant, etc.).
   - A standardized "Settings" and "More" menu.
   - Drag handles for mobility.
2. **Shell Improvements:**
   - Optimize resizing and snapping logic if applicable.
   - Improve the "Active/Passive/Dormant" state transitions.
   - Ensure consistent padding and border-radius.
3. **Menu System:** Implement a reusable `WidgetMenu` component that uses a consistent dropdown pattern (e.g., using Radix UI if already in the project).

## Constraints

- Do not break existing widget layouts.
- Keep `WidgetHeader.tsx` manageable; extract sub-components (like `WidgetMenu`) if it becomes too large (it's currently 26KB+).

## Files Likely Affected

- `features/widgets/components/WidgetShell.tsx`
- `features/widgets/components/WidgetHeader.tsx`
- `features/widgets/components/WidgetMenu.tsx` (Potential new file)

## Validation

- Test with various widget types.
- Verify drag-and-drop and resize still work perfectly.
- Check menu accessibility.

## Completion Notes

Extracted `BackgroundPanel`, `ColorPicker`, `ScheduleSection`, and `VisibilityPanel` from `WidgetHeader.tsx` into new `features/widgets/components/WidgetSettingsPanels.tsx`. `WidgetHeader.tsx` reduced from 623 → 240 lines; `WidgetSettingsPanels.tsx` is 262 lines — both within the 300-line constraint. All types and imports updated; zero type errors. No functional changes made.
