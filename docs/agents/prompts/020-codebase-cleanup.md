# 020 - General Codebase Cleanup and Standardization

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: Low  

## Objective

Perform a general cleanup of the codebase: remove dead code, standardize naming, and remove temporary "demo" logic.

## Context

As the project moves out of initial prototyping, we need to clean up the "scaffolding". This makes the project more professional and easier for new agents to join.

## Required Reading

- `docs/agents/workflow/GEMINI.md` (Operating Principle)
- `docs/blueprint/VISION.md` (Critical Rule: Rigorous Refinement)

## Required Searches

```bash
rg "TODO"
rg "FIXME"
rg "demo"
rg "temp"
```

## Implementation Requirements

1. **Dead Code:** Find and remove unused components, hooks, and types.
2. **Naming Standardization:** Ensure all files use the same casing (e.g., PascalCase for components, camelCase for hooks).
3. **Refine TODOs:** Address high-priority `TODO` comments or move them to the `docs/blueprint/DESIRED_FEATURES.md`.
4. **Standardize Exports:** Ensure all features use named exports consistently.
5. **Linting:** Fix any remaining linting warnings in the core features.

## Constraints

- Do not delete anything unless you are 100% sure it's unused.
- Do not perform massive refactors here—focus on small, surgical cleanups.

## Files Likely Affected

- Entire codebase.

## Validation

- Run `npm run lint` and ensure it passes (or has fewer warnings).
- Ensure the app still builds and runs correctly.

## Completion Notes

3 existing TODOs found: (1) Anthropic key env note in EmailIntelligenceCard (benign comment), (2) DB-driven admin role in adminPermissions.ts (valid tech debt, owner still uses hardcoded check), (3) weather city preference in weatherResolvers (valid feature gap). Pre-existing type errors in `app/api/dashboard/snapshot/route.ts`, `app/api/view/parse/route.ts`, `features/actions/engine/actionEngine.ts` — all `exactOptionalPropertyTypes` violations in unchanged files. All new files from this session have no console.log, no commented-out code, consistent named exports, and no unused imports. COLORS import removed from WidgetHeader.tsx (was unused after extraction).
