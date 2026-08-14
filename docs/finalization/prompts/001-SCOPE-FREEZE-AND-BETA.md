# 001 — Enforce the V1 Breadth Freeze and Suspended Beta

Status: Complete  
Priority: Critical  
Depends on: None

## Objective

Make the finalization scope visible and enforceable in the product. Chess,
Creative/Art Studio, Memorization, and Reading remain accessible only as
clearly labeled beta experiences and no longer appear in default onboarding,
generated workspaces, or primary V1 recommendations. Timeline Intelligence
remains a core V1 surface and must not inherit the entertainment suspension.

## Required investigation

- Locate every registry, catalog, navigation item, onboarding map, default
  dashboard, workspace generator, command palette, add-widget category, and
  recommendation path referencing the suspended features.
- Determine how `betaState` is currently propagated and where catalog entries
  are forcibly marked stable.
- Inspect existing beta preference or feature-flag behavior before adding a
  new mechanism.
- Check open PRs for overlapping dashboard or registry changes.

## Required implementation

- Mark the four suspended surfaces beta at their canonical feature/widget
  definitions.
- Exclude them from automatic onboarding recommendations and generated
  workspaces unless the user has explicitly enabled beta experiences.
- Remove them from primary V1 navigation while preserving direct routes and
  user-owned existing layouts.
- Add a visible Beta label wherever a suspended feature remains discoverable.
- Separate Timeline Intelligence from the Entertainment grouping in the
  add-widget experience. Do not hide or beta-label the timeline because it
  previously shared the category.
- Preserve existing user data and widget instances. Do not delete feature
  code, routes, tables, or layouts.
- Add tests for beta filtering, existing-layout preservation, catalog status,
  and onboarding exclusion.
- Update product documentation and maturity notes affected by the change.

## Non-goals

- Do not refactor the widget registration pipeline.
- Do not redesign the entertainment features.
- Do not create a general feature-flag platform unless no current mechanism
  can meet the acceptance criteria.
- Do not beta-label finance, health, recovery, research, or other features as
  part of this task.

## Acceptance criteria

- A new non-beta user is not recommended Chess, Creative, Memorization, or
  Reading during onboarding or workspace generation.
- The four features are labeled Beta when deliberately discovered.
- Existing dashboards containing them still render without data loss.
- Timeline Intelligence remains stable and discoverable outside the
  Entertainment grouping.
- Tests prove filtering is driven by canonical beta state rather than a
  scattered hard-coded list where practical.

## Validation and handoff

Run targeted platform, onboarding, search, and dashboard checks plus relevant
unit tests. Report every surface audited, any remaining discoverability path,
and whether Prompt 002 remains unblocked.

## Completion evidence

Completed on 2026-08-13 on branch `codex/001-scope-freeze-beta`.

- Added one canonical V1 release policy for Chess, Creative, Memorization,
  and Reading, and propagated it through the platform library, search catalog,
  onboarding, workspace generation, smart recommendations, and dashboard
  default-layout creation.
- Preserved saved layouts and runtime manifests. Suspended widgets already
  owned by a user continue to reconcile and render; their widget shell now
  displays Beta.
- Removed suspended features from default onboarding selection, generated
  workspace suggestions, automatic search suggestions, and command-palette
  quick actions. They remain deliberately discoverable in the catalog where
  an entry exists and are labeled Beta there.
- Moved the stable `news` widget into a separate Timeline Intelligence
  add-widget category and renamed its catalog presentation without changing
  its widget type, route, or persisted instances.
- Audited the search catalog, dashboard library and defaults, add-widget
  categories, command palette, onboarding recommendation and generation
  paths, widget renderer/runtime manifests, feature navigation, and existing
  layout reconciliation.
- Verified 39 focused unit tests across dashboard, platform, onboarding, and
  search; the web TypeScript check and targeted ESLint check passed. The full
  unit suite still has the three known, pre-existing failures tracked by
  issue #21; Prompt 001 did not touch those behaviors.
- No schema, migration, user-data rewrite, secret, or deployment change is
  required. Rollback is the code-only reversal of this prompt; saved user
  layouts were never mutated.

Prompt 002 remains unblocked and is the next finalization checkpoint.
