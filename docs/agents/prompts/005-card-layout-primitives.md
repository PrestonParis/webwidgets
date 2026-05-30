# 005 - Reusable Card and Layout Primitives

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: Medium

## Objective

Create a set of reusable `Card` and layout primitives that widgets can use for internal organization.

## Context

Many widgets use similar patterns: lists of items, grids of stats, or simple cards. Instead of every widget re-implementing these, we should have a shared library in `features/ui/`.

## Required Reading

- `features/ui/`
- `docs/blueprint/VISION.md` (UI Philosophy)

## Required Searches

```bash
rg "Card" features
rg "Flex" features/ui
rg "Grid" features/ui
```

## Implementation Requirements

1. **Card Primitive:** A highly customizable `Card` component with support for:
   - Hover effects.
   - Selection states.
   - Footers/Headers.
   - Glassmorphism/Modern styles.
2. **Layout Primitives:** `Stack`, `Group`, and `SimpleGrid` components (if not already using a library like Mantine/Chakra/Tailwind classes).
3. **Consistency:** Replace ad-hoc `div` styling in widgets with these primitives.

## Constraints

- Use Tailwind CSS for styling as per project conventions.
- Keep primitives "dumb"—they should only handle layout and style, not data or business logic.

## Files Likely Affected

- `features/ui/components/Card.tsx` (New/Refined)
- `features/ui/components/Layout.tsx` (New/Refined)
- Various widget components.

## Validation

- Audit 5 widgets and see if they can be refactored to use these primitives.
- Ensure no visual regressions.

## Completion Notes

Created `features/ui/components/Card.tsx` with `Card` (interactive/selected/glass variants, 4 padding sizes), `CardHeader` (title + description + action slot), `CardFooter` (optional top border). All Tailwind, no logic.
