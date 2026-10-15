# WebWidgets V1 Launch Thresholds

These thresholds were frozen on 2026-08-30, before the Prompt 19 pilot. They
apply to the controlled staging cohort and are evaluated over seven complete,
consecutive 24-hour windows. A day with missing telemetry does not count.

## Thresholds

| Measure                   | Launch threshold                                                                                                         | Evidence source                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Source sync success       | At least 99% of due controlled-source syncs reach `healthy`; every failure is visible                                    | Operations snapshot and source-health UI    |
| Source sync lag           | Internal projections p95 ≤ 2 minutes; RSS/provider p95 ≤ the configured interval + 10 minutes                            | Timeline timestamps and operations snapshot |
| Duplicate timeline events | 0 canonical duplicates for the same owner/idempotency key                                                                | Canonical counts and V1 E2E replay          |
| Duplicate side effects    | 0 duplicate tasks, provider events, messages, or workflow runs                                                           | Action receipts and V1 E2E replay           |
| Briefing latency          | p95 ≤ 120 seconds from accepted request to terminal result                                                               | Briefing records                            |
| Briefing cost             | Mean ≤ $0.05 and maximum ≤ $0.10 per generated briefing                                                                  | Inference audit totals                      |
| Briefing evidence         | 100% of surfaced items have at least one owner-matched timeline citation                                                 | Briefing evidence links                     |
| Briefing usefulness       | At least 70% `useful`; `incorrect` ≤ 5%, with at least 10 rated items or all produced items when fewer exist             | Briefing feedback                           |
| Candidate precision       | At least 80% of reviewed candidates are approved or retained after edit; `incorrect` ≤ 10%                               | Candidate review ledger                     |
| Candidate dismissal       | Dismissed ≤ 30% of reviewed candidates                                                                                   | Candidate review ledger                     |
| Action success            | At least 99% of attempted controlled actions finish verified; 0 fake-success receipts                                    | Action request/result ledger                |
| Automation success        | At least 99% of eligible controlled runs reach the expected terminal state; 100% of paused/disabled triggers are skipped | Automation history                          |
| Job recovery              | 100% of injected restart/retry cases reach one terminal result with no duplicate side effect                             | Job ledger and replay tests                 |
| Critical recovery time    | Detection ≤ 15 minutes; service restored or safely paused ≤ 4 hours                                                      | Incident log and alert timestamps           |
| Security findings         | 0 open critical/high findings and 0 secret/private-content exposure in logs or fixtures                                  | Security audit and daily review             |

## Decision rule

Any duplicate side effect, silent data loss, uncited briefing claim, fake
success, autonomous email send, critical/high security finding, or missed
pause control is an automatic `No Go`. Other missed thresholds produce a
`Conditional Go` only when the release owner documents a bounded fix and the
affected measurement is rerun; otherwise the result is `No Go`.

Free Render sleep latency is measured but is not exempt from correctness.
Before a public V1 launch, the worker and queue must move to continuous compute
and persistent storage as required by ADR-014/015.
