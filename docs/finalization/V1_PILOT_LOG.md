# WebWidgets V1 Seven-Day Pilot

## State

- Cohort: one disposable controlled account plus explicitly approved owner
  testing; synthetic content only in defects and committed fixtures.
- Environment: production web, production-like Supabase, Render V1 worker and
  queue, governed inference service.
- Threshold contract: [V1_LAUNCH_THRESHOLDS.md](V1_LAUNCH_THRESHOLDS.md).
- Release suite: `npm run test:v1` with the environment described below.
- Start: not yet recorded.
- Consecutive qualifying days: 0 of 7.

## Preflight evidence

On 2026-08-30, all three release journeys passed against `webwidgets.me` and
the linked WebWidgets Supabase/Render services using one disposable synthetic
account: 3 passed in 22.5 seconds. This proves the release suite is runnable
but is not a substitute for a complete 24-hour pilot window. Day 1 remains
pending.

## Non-qualifying windows

### 2026-08-31 UTC

This window does not start or advance the seven-day count. A persistent
controlled pilot cohort and full-window evidence capture were not active, so
the review cannot establish source sync/lag, duplicate handling, briefing
latency/cost/usefulness, commitment-candidate quality, action and automation
outcomes, pause behavior, or recovery behavior for the complete UTC window.
External alert delivery also remains unconfigured.

At the following review, on 2026-09-01, the production web liveness and
readiness endpoints returned HTTP 200. The Render worker endpoints did not
respond within the review window, and the protected aggregate operations
snapshot was unavailable to the automated review. These point-in-time checks
cannot replace the missing 24-hour evidence. Result: **not counted; 0 of 7**.

Before another window can qualify, establish the controlled cohort, retain
all required aggregate evidence continuously from 00:00 through 23:59 UTC,
verify the worker stays observable through free-tier sleep/wake behavior, and
configure verifiable external alert delivery.

### 2026-09-01 UTC

This window also does not start or advance the count. No retained full-window
evidence was available for the controlled cohort, source sync/lag, duplicates,
briefing quality/latency/cost, commitment candidates, action and automation
outcomes, pause and recovery behavior, or external alert delivery.

At the following review, on 2026-09-02, the production web liveness and
readiness endpoints returned HTTP 200. Point-in-time probes of the Render
worker and inference readiness endpoints timed out. These checks do not prove
the missing 24-hour categories. Result: **not counted; 0 of 7**. The setup
requirements recorded for the previous window remain unresolved.

## Release-suite environment

Set `BASE_URL`, `V1_E2E_SUPABASE_URL`, and
`V1_E2E_SERVICE_ROLE_KEY` in the operator shell. The test creates and deletes
its own confirmed account. `V1_E2E_FEED_URL` and
`V1_E2E_FAILED_FEED_URL` are optional overrides; the default URLs use the
deployed synthetic feed and a deliberate 404 on `BASE_URL`. Never commit or
print the service-role value.

## Daily review

For each UTC day, record only counts, durations, safe identifiers, and issue
links. Do not copy emails, feed bodies, task notes, tokens, prompts, or other
private content into this file.

| Day | Window  | Sync/lag | Duplicates | Briefing | Candidates | Actions/automation | Security/alerts | Result  |
| --- | ------- | -------- | ---------- | -------- | ---------- | ------------------ | --------------- | ------- |
| 1   | Pending | Pending  | Pending    | Pending  | Pending    | Pending            | Pending         | Pending |
| 2   | Pending | Pending  | Pending    | Pending  | Pending    | Pending            | Pending         | Pending |
| 3   | Pending | Pending  | Pending    | Pending  | Pending    | Pending            | Pending         | Pending |
| 4   | Pending | Pending  | Pending    | Pending  | Pending    | Pending            | Pending         | Pending |
| 5   | Pending | Pending  | Pending    | Pending  | Pending    | Pending            | Pending         | Pending |
| 6   | Pending | Pending  | Pending    | Pending  | Pending    | Pending            | Pending         | Pending |
| 7   | Pending | Pending  | Pending    | Pending  | Pending    | Pending            | Pending         | Pending |

## Daily procedure

1. Confirm web, worker `/ready`, queue, Supabase, and inference health.
2. Capture the protected operations snapshot and safe alert state.
3. Run or inspect scheduled source sync and bounded automation.
4. Review gaps, lag, duplicates, model failures, incorrect claims/candidates,
   failed/unknown actions, cost, and security events.
5. Record a safe summary above and link any launch-blocking issue.
6. Restart the seven-day count after a day with missing evidence, silent data
   loss, duplicate side effect, or an unresolved automatic `No Go` condition.

The implementing agent may gather evidence but cannot approve the final
release decision. The release owner signs the acceptance matrix after day 7.
