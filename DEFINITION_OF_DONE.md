# Definition of Done

What must be true before an agent-created task (Claude, Codex, or Copilot)
is considered complete and ready for human review. This is the bar automated
CI and human or peer-agent reviewers check PRs against. CI does not exist
yet in this repository (see ROADMAP.md §3, "CI from scratch") — until it
does, this document is the checklist a reviewer applies manually.

The repo currently has **no CI** and a non-trivial existing lint/type debt
(1,603 lint errors, 54 TypeScript errors as of the 2026-08-09 snapshot in
`reports/`) and **no working commit-time hooks** (Husky is installed but
`.husky/pre-commit` doesn't exist). None of that is the fault of any single
PR. The rules below are written so a PR can be judged on its own diff, not
held hostage to a repo-wide baseline it didn't create — but they also close
the gaps that made that baseline possible in the first place.

---

## 1. Acceptance criteria

- Every acceptance-criterion line in the source issue is satisfied. If one
  can't be (blocked, ambiguous, or wrong), the PR says so explicitly and
  does not silently drop it.
- No product requirement was reinterpreted or narrowed without saying so in
  the PR description.

## 2. Lint and typecheck — zero new errors, not zero total errors

- Run `npm run check` scoped to the changed area (e.g.
  `npm run check features/dashboard`) — every file the PR **touches or
  creates** must be clean: zero lint errors, zero TypeScript errors, zero
  `smells` regressions (long-function/long-file/deep-nesting/any-usage) in
  those files.
- The PR is not required to fix pre-existing errors in files it didn't
  otherwise need to touch. Do not use a task as an excuse for a drive-by
  repo-wide lint sweep (see AGENTS.md's rules on unrelated changes) — but do
  not add to the debt either.
- No `eslint-disable` directives, ever. If a rule is genuinely wrong for the
  situation, that's a conversation for a human, not a suppression.
- No new `any`. No inline SVG outside `icons/`. No direct
  `fetch('/api/...')` calls inside components (centralize in an API service
  module). See AGENTS.md for the full linting-compliance ruleset (file
  size, function size, hook count, etc.) this is scoped against.

## 3. Tests

- **Unit tests** (Vitest, `tests/unit/`): required for new or changed
  business logic in `apps/web/features/**` or `apps/web/lib/**`. Pure
  UI/presentational changes with no logic branches don't need one, but say
  so in the PR.
- **Integration tests**: required when the change crosses a real boundary —
  a new API route, a Supabase query with non-trivial filtering/RLS
  implications, a new external-API adapter. WebWidgets doesn't yet have a
  dedicated integration layer (`tests/COMMANDS.md` says as much); until one
  exists, these land as Vitest tests that exercise the route/handler
  directly rather than mocking the boundary away.
- **E2E tests** (Playwright): required only for changes touching a critical
  journey — auth, workspace/dashboard creation, widget rendering, widget
  persistence, file upload/viewing, context recall, or an integration
  connect flow. Do not add E2E coverage for anything else; it's expensive
  and this repo's E2E layer is already thinner than its scaffolding implies.
- **Do not treat `npm run test:dashboard`, `test:performance`, or
  `test:hydration` as functioning gates** — as of this audit they point at
  directories that don't exist (`tests/e2e/dashboard`, `tests/e2e/performance`,
  `tests/e2e/hydration`). If a task is meant to add that coverage, say so
  explicitly; otherwise use `test:widgets`, `test:traversal`, or a scoped
  Playwright invocation against real spec files.
- Never weaken, skip, or delete a test to make CI pass. If a test is
  actually wrong (asserts old, incorrect behavior), fix the test and say
  why in the PR — don't just remove the assertion.

## 4. Scope

- No unrelated changes. A bug fix doesn't carry a drive-by refactor; a
  feature doesn't reformat files it didn't need to touch.
- Feature-boundary rule holds: `features/<x>/` doesn't import from
  `features/<y>/` (ADR-004). Shared code goes in `lib/`.
- Widget registration changes (ARCHITECTURE.md §4) are scoped to one widget
  per PR unless the issue explicitly says otherwise — this is the repo's
  single highest merge-conflict surface.

## 5. Documentation

- `ARCHITECTURE.md` updated if the change alters a data flow, adds a
  service, or changes an ownership boundary described there.
- A new ADR added to `docs/agents/workflow/DECISIONS.md` if the change
  makes an architecture-level, folder-structure, data-model, or API-boundary
  decision that future agents would otherwise have to rediscover (see the
  ADR-001–007 format already in use there).
- `ROADMAP.md`'s maturity table updated if the change moves a system from
  one maturity state to another (e.g. `partial` → `working`).

## 6. Migrations

- Any schema change lands as a new file in `supabase/migrations/`,
  timestamped `YYYYMMDDHHMM_description.sql`, regardless of the fact that
  most of the existing schema predates migration tracking (ARCHITECTURE.md
  §8). Don't perpetuate the untracked-schema problem.
- New or changed tables that hold user data have RLS policies in the same
  migration, not a follow-up. No table ships without RLS unless it's
  explicitly and intentionally public/shared (e.g. `reading_documents` with
  `NULL user_id`), and that exception is called out in the PR.
- If a migration can't be verified against the live schema (see the
  schema-drift note in ARCHITECTURE.md §8), the PR says what was checked
  (e.g. `supabase gen types typescript` diff) instead of assuming the
  migrations directory is ground truth.

## 7. Security / access control

- Any new server route that reads or writes user data goes through
  RLS-scoped access, not the admin/service-role client, unless it's inside
  `/app/api/**` and has an explicit, reviewed reason to use the service role
  (ADR-005). The PR states which one applies.
- No secrets, API keys, or tokens committed, logged, or echoed back in
  responses/error messages.
- Any change touching the conversion pipeline's HTML handling should note
  whether it's affected by the known unsanitized-input gap
  (ARCHITECTURE.md §9) rather than silently building on top of it.

## 8. PR description

- States what changed and why, referencing the source issue.
- States what testing was actually performed (which commands were run, not
  just "tests pass") — including when a category in §3 was intentionally
  skipped and why.
- Notes any deviation from the issue's original scope, and any follow-up
  work spun out rather than silently expanded into this PR.

## 9. What "done" does not require

- It does not require the whole repo to pass `npm run check` clean — that
  baseline doesn't exist today and fixing it isn't any single task's job
  (see ROADMAP.md §4 for the tracked debt-paydown item).
- It does not require `npm run build` to be run by the agent — AGENTS.md §7
  explicitly avoids it locally due to RAM constraints (a convention
  inherited from this repo's earlier `docs/agents/workflow/GEMINI.md`
  workflow); CI, once it exists, is where the build gets verified.
- It does not require inventing E2E coverage for non-critical journeys.
