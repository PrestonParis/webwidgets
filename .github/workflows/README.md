# CI workflows

## `ci.yml` — baseline PR/main validation

Runs on every pull request into `main`, every push to `main`, and on-demand
via `workflow_dispatch`. See DEFINITION_OF_DONE.md for the philosophy this
implements; this file documents the mechanics.

### Job names (for branch protection)

If you want to require these before merge (Settings → Branches → Branch
protection rule for `main` → "Require status checks to pass"), the job
names to select are:

- `Lint + typecheck (changed files)` — skipped (shows as passing/neutral)
  when the PR touches nothing under `apps/web/`, `scripts/`, `tests/`, or
  root TS/lint config.
- `Unit tests (Vitest)` — always runs.
- `Python (ML service)` — skipped unless `services/ml_service/**` changed.
- `Conversion service` — skipped unless `services/conversion/**` changed.
- `Sync worker` — skipped unless `services/sync-worker/**` changed.
- `Production build` — always runs, but only after
  `Lint + typecheck` and `Unit tests` succeed (or are skipped).

GitHub treats a skipped required check as passing by default, so marking
all of these required is safe even though most PRs will only trigger a
subset.

### Why "changed files," not "whole repo"

As of the 2026-08-09 snapshot in `reports/`, the repo has 1,603 pre-existing
lint errors and 54 pre-existing TypeScript errors (see ROADMAP.md §2 and §4,
and DEFINITION_OF_DONE.md §2). A CI gate that required the whole repo to be
clean would block every PR, including ones that have nothing to do with that
debt. Instead:

- **ESLint** runs directly against the list of changed `.ts`/`.tsx` files
  under `apps/web/` (via `npx eslint <files>`), not the whole-repo chunked
  runner in `scripts/linting/` (that tool exists for the full local/nightly
  picture — see the root-level daily quality report — not for
  per-file CI gating).
- **TypeScript** doesn't support checking a file in isolation with full type
  accuracy, so this workflow runs `tsc --noEmit` for the whole project (as
  it must) and then greps the output for lines matching a changed file. Only
  errors in files the PR touched fail the build.
- **`services/conversion` and `services/sync-worker`** are checked with
  their own scripts (`npm run typecheck`, `npm run build`) only when a file
  under their respective directories changed, since they're independently
  managed (own `package-lock.json`, not part of the root install).

This means a PR can merge with the existing debt still present, but cannot
introduce new errors in files it touches. Paying down the existing debt is
tracked as its own item in ROADMAP.md §4, not something any single PR is
expected to absorb.

### What's intentionally not gated here

- **`services/conversion`'s full test suite** isn't run against live
  infrastructure — no Redis/Postgres/MinIO containers are started in CI
  (`Jobs have practical timeouts and no persistent services` was an explicit
  requirement). Its smoke tests are written to self-skip anything that needs
  live infra (confirmed by reading `tests/smoke/api-smoke.test.ts` before
  wiring this up — they TCP-probe first), so `npm run test` still runs
  safely and exercises the infra-independent assertions.
- **`services/ml_service`'s security/deps/deadcode/smells checks**
  (`bandit`, `deptry`, `vulture`) aren't run in this gate — only
  format/lint/typecheck/test. Those advisory checks stay manual
  (`npm run py:check` locally), mirroring the lint-vs-smells gating split
  `scripts/linting/index.ts` already uses.
- **`npm run build`** only ever runs here, in CI — AGENTS.md §7 explicitly
  tells agents not to run it locally due to RAM constraints on agent
  machines.
