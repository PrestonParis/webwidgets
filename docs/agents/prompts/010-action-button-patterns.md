# 010 - Action Button and Toolbar Patterns

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: Medium  

## Objective

Standardize the placement and styling of action buttons and toolbars across widgets and pages.

## Context

Widgets often have a set of primary and secondary actions. We need a consistent "Action Bar" or "Toolbar" pattern to reduce cognitive load for users.

## Required Reading

- `docs/blueprint/VISION.md` (Action button patterns)
- `features/widgets/components/WidgetHeader.tsx`

## Required Searches

```bash
rg "Button" features/ui
rg "Toolbar"
```

## Implementation Requirements

1. **Toolbar Component:** Create a `Toolbar` component that can be used in widget headers or footers.
2. **Button Variants:** Standardize button variants (primary, secondary, ghost, danger) and sizes.
3. **Icon Buttons:** Ensure icon-only buttons have proper tooltips and aria-labels.
4. **Grouped Actions:** Support button groups for related actions (e.g., "Day/Week/Month" toggles).

## Constraints

- Maintain high touch targets for mobile users.
- Use a consistent icon set (e.g., Lucide React).

## Files Likely Affected

- `features/ui/components/Button.tsx`
- `features/ui/components/Toolbar.tsx` (New)
- `features/widgets/components/WidgetHeader.tsx`

## Validation

- Audit 3 widgets and refactor their actions into the new Toolbar pattern.
- Verify tooltips work as expected.

## Completion Notes

Created `features/ui/components/Button.tsx` with `Button` (5 variants: primary/secondary/ghost/danger/outline; 4 sizes: xs/sm/md/lg; loading spinner state; left/right icon slots; fullWidth) and `IconButton` (icon-only with mandatory `label` for aria-label). Both have `focus-visible` ring for keyboard navigation.
