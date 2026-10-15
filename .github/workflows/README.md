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
  when the PR touches nothing under `apps/web/`, `scripts/linting/`, `tests/`,
  or root TS/lint config.
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

Most of `scripts/` remains private/local-only, but `scripts/linting/` is
versioned because the scheduled lint-report workflow must reproduce the same
complete repository report on a clean runner. The baseline PR workflow below
still uses direct changed-file `eslint`/`tsc` commands so existing repository
debt does not block unrelated PRs. The scheduled `daily-lint-report.yml`
workflow intentionally runs the complete `npm run check`, publishes every
finding, and then preserves its failing status when the full check finds
gating errors.

- **ESLint** runs directly against the list of changed `.ts`/`.tsx` files
  under `apps/web/` (via `npx eslint <files>`) — a lightweight, self-contained
  invocation chosen to keep pull-request gating scoped to changed files.
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

## `daily-lint-report.yml` — Google Sheets reporting

Runs the complete repository check every day at 11:00 PM in
`America/New_York`, including daylight-saving changes, and can also be started
manually. Scheduled workflows run from the default branch, so the workflow and
versioned `scripts/linting/` directory must be merged before the schedule is
active.

The repository must define this Actions secret:

- `GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON` — the complete JSON key for the Google
  service account that has Editor access to the reporting spreadsheet.

Set it without printing the key:

```bash
gh secret set GOOGLE_SHEETS_SERVICE_ACCOUNT_JSON < /absolute/path/to/service-account.json
```

The publisher maintains these tabs and validates their header rows before
writing:

- `Daily Runs`
- `Lint Findings`
- `TypeScript Findings`
- `Code Smells`
- `Repository Stats`

Rows use the GitHub run ID for idempotency. A rerun does not append the same
run to a tab twice. Findings are sent with the Sheets API `RAW` input mode so a
lint message beginning with a formula character cannot execute as a formula.
The workflow publishes a report even when the repository check finds errors,
then fails the Actions run to preserve the actual check status.

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
