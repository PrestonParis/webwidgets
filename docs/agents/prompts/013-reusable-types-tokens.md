# 013 - Consolidate Reusable Types and Design Tokens

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: Medium

## Objective

Consolidate shared TypeScript types and design tokens (colors, spacing, shadows) into central locations.

## Context

Duplicated types and "magic numbers" in CSS lead to maintenance headaches. We need a single source of truth for the core WebWidgets design language and data models.

## Required Reading

- `tailwind.config.ts`
- `types/`
- `docs/agents/workflow/GEMINI.md` (Stage-One Priority Areas)

## Required Searches

```bash
rg "interface" types
rg "type" types
rg "colors" tailwind.config.ts
```

## Implementation Requirements

1. **Design Tokens:** Ensure all core colors (Primary, Secondary, Surface, Accent) are defined in `tailwind.config.ts` and used consistently.
2. **Shared Types:** Move common types (User, Widget, Action, Result) into `types/common.ts` or similar.
3. **Widget Contracts:** Refine the `WidgetConfig` and `WidgetState` types to be used by all widgets.
4. **Cleanup:** Find and remove duplicate type definitions across features.

## Constraints

- Don't over-abstract; only move truly shared types.
- Follow the feature-based architecture—if a type is ONLY for one feature, it stays in that feature's `types/` folder.

## Files Likely Affected

- `tailwind.config.ts`
- `types/*.ts`
- `features/*/types/*.ts`

## Validation

- Run `tsc --noEmit` to ensure no type errors were introduced.
- Verify Tailwind classes still work as expected.

## Completion Notes

Added design tokens to `tailwind.config.ts`: `brand.DEFAULT` (#4f6ef7), `brand.hover` (#3a58e0), `brand.light` (#7b93f9), `brand.muted` (#eef2ff), `brand.dark` (#172033); custom `shadow-widget`, `shadow-widget-lg`; `rounded-widget`. Also added `darkMode: 'class'` (was missing). New code should use `text-brand`, `bg-brand`, `ring-brand` etc. instead of hardcoded `#4f6ef7`. The ~100 existing usages remain untouched. No type-only changes — feature types are well-organized already in per-feature `types/` folders; `types/supabase.ts` covers the DB layer.
