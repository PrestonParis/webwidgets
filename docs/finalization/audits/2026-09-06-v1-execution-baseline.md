# V1 execution baseline — 2026-09-06

Evidence captured: 2026-09-07 00:11–00:15 UTC

Release branch revision: `8a2b6357e787ef5fc847c39c9b97288af68f6c6d`

Decision: **No Go; V2-004 remains in progress**

## Result

The deployed web and TypeScript worker are reachable and the worker reports Redis and Supabase ready on the same release revision as `origin/finalization`. That proves a live execution process, not a production-ready system. The safe aggregate operations snapshot contains three automatic stop conditions: seven dead letters in 24 hours, an oldest queued job age of 1,725,311 seconds, and seven degraded sources out of fifteen active sources. The seven-day pilot remains at 0 of 7.

The current Render blueprint is still explicitly free/sleeping compute with non-persistent Key Value storage. GitHub CI reports failures and successes correctly, but required checks cannot be enabled for this private repository on the current plan. External alert delivery is not configured. No production recovery/rollback drill is recorded. Production Supabase has migration `202609030001`, while the release branch stops at `202608300005`; the only local copy of the newer migration is untracked in the owner's dirty checkout.

## Evidence matrix

| Gate                       | Evidence                                                                                              | Result                          |
| -------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------- |
| Production web             | `https://webwidgets.me/api/healthz` and `/api/ready` returned HTTP 200 at 00:11 UTC                   | Pass, point-in-time             |
| TypeScript worker          | Render `/ready` returned `ready=true`, `redis=true`, `supabase=true`                                  | Pass, point-in-time             |
| Release identity           | Operations snapshot reported worker release `8a2b6357e787ef5fc847c39c9b97288af68f6c6d`                | Pass                            |
| Persistent queue           | `render.yaml` uses free Key Value with `persistenceMode: off`                                         | Blocker                         |
| Queue health               | Depth 1; oldest age 1,725,311 seconds; 7 dead letters in 24 hours                                     | Automatic No Go                 |
| Source health              | 15 active; 7 degraded; 0 overdue                                                                      | Automatic No Go: 46.7% degraded |
| Timeline duplication       | 94 events in 24 hours; 0 persisted duplicate groups                                                   | Pass for captured snapshot      |
| Actions                    | 0 succeeded and 0 failed/unknown in 24 hours                                                          | No execution evidence           |
| Automations                | 0 failures, 0 cancellations, 1 user paused                                                            | No successful-run evidence      |
| Briefings/inference        | 0 requests, failures, feedback, or cost in 24 hours                                                   | No execution/quality evidence   |
| External alert             | Rules and protected metrics exist; no scraper/receiver or delivered test alert is recorded            | Blocker                         |
| CI reporting               | Run `34053652048` passed every CI job; run `33328981752` failed on ESLint                             | Pass                            |
| CI enforcement             | Branch-protection API returned HTTP 403: plan does not support protection for this private repository | Blocker                         |
| Schema reproducibility     | Linked database lists `202609030001`; `origin/finalization` does not contain it                       | Blocker                         |
| Recovery/rollback          | Unit/pgTAP failure exercises and runbook exist; no dated production-like restore/rollback exercise    | Blocker                         |
| Seven-day pilot            | No qualifying complete UTC window; 0 of 7                                                             | Blocker                         |
| Daily review automation    | Active heartbeat exists; its 2026-09-06 23:01 UTC run failed on Codex usage capacity                  | Unreliable until next success   |
| Independent release review | PR #22 has no review decision and remains open against `main`                                         | Blocker                         |

The operations snapshot is safe aggregate evidence from `public.get_v1_operations_snapshot()`. No source content, credential, prompt, payload, or provider response was copied into this report.

## Required sequence to start day 1

1. Reconcile migration `202609030001_widget_builder_and_schema_gaps.sql`: review its provenance and RLS/rollback behavior, commit the exact deployed migration on a dedicated branch, and prove local/remote migration parity. Do not reconstruct or replace the deployed migration with a different file.
2. Upgrade the Render worker to continuous compute and the Key Value service to persistent storage. Redeploy, verify the release identity, and prove a queued fixture survives a controlled restart exactly once.
3. Triage the seven dead letters and the 20-day-old queued job using safe job IDs and failure codes. Reconcile ambiguous provider effects before any retry. The pilot cannot start while either condition exists.
4. Resolve the seven degraded sources or remove intentionally inactive controlled sources from the pilot cohort. Recheck that degradation is below the frozen threshold.
5. Configure an external scraper and owned alert receiver for the tracked rules. Send one test alert and preserve its timestamp and receipt.
6. Enable required checks by upgrading the GitHub plan or changing repository visibility, then prove a deliberately failing PR cannot merge and a fully passing reviewed PR can.
7. Run a dated production-like rollback exercise: pause automation, stop/restart the worker, recover a queued fixture exactly once, verify canonical receipts, and document recovery time. Exercise schema restore only against a disposable environment.
8. Establish the controlled cohort and retained daily evidence. Only then start a new seven-consecutive-day count. The active Codex daily review can audit the evidence but cannot create missing telemetry after the fact.

## Completion rule

V2-004 completes only after all seven consecutive rows in `V1_PILOT_LOG.md` contain evidence, an external alert reaches an owned receiver, required CI checks are enforced, restart and rollback recovery are exercised, schema history is reproducible, and a non-author human release owner signs the decision. Point-in-time readiness and green CI are necessary but not sufficient.
