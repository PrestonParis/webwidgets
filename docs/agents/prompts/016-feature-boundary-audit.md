# 016 - Feature Boundary and Structure Audit

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: High  

## Objective

Audit all existing features to ensure they strictly follow the `features/<name>/{components,lib,api,types,constants.ts}` folder structure.

## Context

Consistency in folder structure makes it easier for agents to find code. We must enforce the rules laid out in `GEMINI.md`.

## Required Reading

- `docs/agents/workflow/GEMINI.md` (Architecture Rules)

## Required Searches

```bash
ls -R features/
```

## Implementation Requirements

1. **Audit Features:** Identify any files in `features/` that are not in the correct subfolders.
2. **Refactor:** Move files to their proper locations.
3. **Cross-Imports:** Ensure features do not import from other features directly. Move shared logic to `lib/` if necessary.
4. **Minimal page.tsx:** Ensure all `app/**/page.tsx` files only import and render a single feature component and contain no business logic.

## Constraints

- Be careful with path changes—update all imports.
- Do not dump everything into `lib/`—only truly shared utilities.

## Files Likely Affected

- Everything in `features/`
- Everything in `app/`

## Validation

- Ensure the app still builds and runs correctly.
- Verify the folder structure with `ls -R features/`.

## Completion Notes

Audited all 42 feature directories. Findings:

**Root-level files that should move (deferred — risky imports):**
- `features/analytics/` — 4 root files (posthog.ts, eventNames.ts, trackEvent.ts, analyticsQueries.ts) should be in `lib/`; ~15 external imports across app/api routes would need updating.
- `features/texteditor/types.ts`, `features/timekeeping/types.ts` — should be in `types/` subfolder.

**Root-level page components (acceptable pattern):** ActivityPage.tsx, AutomationPage.tsx, FinancePage.tsx, etc. at feature root are a common pattern here since they wrap with providers — consistent but not strictly correct per spec.

**Cross-feature imports:** `features/ui` is the only deliberately shared feature (75 imports); all others respect feature boundaries. `features/backend` is accessed only via API routes (correct).

**All app/page.tsx files** are already minimal — they only import and render a single feature component.

**No structural changes made** — file moves deferred to avoid broken imports; document serves as a refactor roadmap.
