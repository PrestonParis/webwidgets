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
  when the PR touches nothing under `apps/web/`, `tests/`, or root TS/lint
  config. (The scope check also matches `scripts/`, but nothing there can
  ever appear in a PR diff — see below.)
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

**Important constraint this workflow works around:** `scripts/` is listed in
`.gitignore` as "Private / local-only" — `scripts/linting/` (the `npm run
check` tooling, and everything that writes to `reports/`) exists only on
whichever machine has it locally; it is **not committed to any branch** and
will not exist on a fresh checkout, including every CI run. The 1,603
lint-error / 54 TS-error snapshot cited in ROADMAP.md and
DEFINITION_OF_DONE.md came from a local run of that private tooling — treat
those specific numbers as a point-in-time estimate from one contributor's
machine, not something CI can reproduce or verify. This workflow therefore
does **not** call `npm run check` or any `linting:*` script anywhere — every
check below is either a direct `eslint`/`tsc` invocation or a service's own
`package.json` script, all of which are fully committed and work from a
clean clone.

- **ESLint** runs directly against the list of changed `.ts`/`.tsx` files
  under `apps/web/` (via `npx eslint <files>`) — a lightweight, self-contained
  invocation chosen specifically so this workflow has no dependency on the
  private `scripts/linting/` runner.
- **TypeScript** doesn't support checking a file in isolation with full type
  accuracy, so this workflow runs `tsc --noEmit` for the whole project (as
  it must) and then greps the output for lines matching a changed file. Only
  errors in files the PR touched fail the build.
- **Python formatting and linting** run directly against changed `.py` files
  under `services/ml_service/`. Basedpyright analyzes the complete service for
  cross-file accuracy, then gates only diagnostics belonging to changed files,
  matching the TypeScript debt-baseline policy.
- **`services/conversion` and `services/sync-worker`** are checked with
  their own scripts (`npm run typecheck`, `npm run build`) only when a file
  under their respective directories changed, since they're independently
  managed (own `package-lock.json`, not part of the root install).

This means a PR can merge with the existing debt still present, but cannot
introduce new errors in files it touches. Paying down the existing debt is
tracked as its own item in ROADMAP.md §4, not something any single PR is
expected to absorb.

The same philosophy applies to unit tests. Wiring up this workflow surfaced
3 pre-existing Vitest failures unrelated to CI itself (tracked in #21).
`Unit tests (Vitest)` runs the full suite unconditionally (unlike
lint/typecheck, tests aren't scoped to changed files — the suite is fast
enough that this isn't worth the added complexity), captures a JSON report,
and `tools/ci/checkTestResults.ts` gates only on failures **not** in its
small, explicitly-documented allowlist. A PR that fixes #21 must remove the
corresponding allowlist entries in the same PR — don't let it go stale.

The Python job follows the same rule. It runs the complete ML pytest suite and
captures JUnit output. Four pre-existing failures discovered when the dormant
job first ran are explicitly named in `tools/ci/checkPythonTestResults.py`;
every other failure gates the PR. Fixing one of those tests requires removing
its allowlist entry in the same change.

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
  (`npm run py:check` locally, for whoever has the private `scripts/`
  tooling that command depends on).
- **`npm run build`** only ever runs here, in CI — AGENTS.md §7 explicitly
  tells agents not to run it locally due to RAM constraints on agent
  machines.
