# WebWidgets V1 Release Acceptance Matrix

Status meanings: `Evidence` has a linked automated or deployed proof;
`Pilot` must be measured during the seven-day run; `Manual` needs release-owner
verification; `Blocker` prevents a Go decision. The release owner must replace
all `Pilot`/`Manual` entries with dated evidence or mark them blockers.

## Product journeys

| ID    | Criterion                                                           | Evidence route                                                                       | Status   |
| ----- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------- |
| PJ-01 | Connect a personal source and RSS/Atom source                       | 2026-08-30 deployed V1 E2E journey 1                                                 | Evidence |
| PJ-02 | Source items appear on owner timeline with provenance               | 2026-08-30 V1 E2E journey 1; `supabase/tests/004`, `005`, `007`                      | Evidence |
| PJ-03 | Generate briefing from real timeline data                           | 2026-08-30 V1 E2E journey 1; `supabase/tests/016`                                    | Evidence |
| PJ-04 | Commitment becomes editable task candidate                          | 2026-08-30 V1 E2E journey 2; `supabase/tests/008`                                    | Evidence |
| PJ-05 | Approval creates exactly one task                                   | 2026-08-30 V1 E2E journey 2; `supabase/tests/009`                                    | Evidence |
| PJ-06 | Task updates/completes with visible outcome                         | 2026-08-30 V1 E2E journey 2; `supabase/tests/009`                                    | Evidence |
| PJ-07 | Approved calendar candidate creates one provider event              | `supabase/tests/012`; provider smoke verification                                    | Manual   |
| PJ-08 | Email response can be prepared without automatic send               | Email action tests and Prompt 14 receipt evidence                                    | Evidence |
| PJ-09 | Gmail primary, Outlook secondary; exact separate send approval      | `tests/unit/actions/emailActionContracts.test.ts`; FIN-019; owner Gmail verification | Evidence |
| PJ-10 | Daily briefing and commitment automations use durable state machine | 2026-08-30 V1 E2E journey 3; `supabase/tests/014`; worker tests                      | Evidence |
| PJ-11 | Inspect, pause, disable, and review automation runs                 | 2026-08-30 V1 E2E journey 3; `supabase/tests/013`, `014`                             | Evidence |

## Timeline quality

| ID    | Criterion                                                           | Evidence route                                        | Status   |
| ----- | ------------------------------------------------------------------- | ----------------------------------------------------- | -------- |
| TQ-01 | Preserve source/reference/provider/fetch/owner/normalization fields | `supabase/tests/004`, `005`, `007`; timeline schema   | Evidence |
| TQ-02 | Reprocessing creates no duplicate event/action                      | 2026-08-30 V1 E2E journeys 1–2; canonical constraints | Evidence |
| TQ-03 | Related feed items are clustered or visibly identified              | RSS normalization tests and timeline related-event UI | Manual   |
| TQ-04 | Source failures and stale syncs are visible                         | 2026-08-30 V1 E2E journey 1; source-health UI         | Evidence |
| TQ-05 | Disconnect stops future ingestion                                   | `supabase/tests/005`; RSS source API                  | Evidence |
| TQ-06 | Retention and deletion follow documented rules                      | canonical-retention migration and lifecycle tests     | Evidence |

## Intelligence quality

| ID    | Criterion                                                                 | Evidence route                                                            | Status   |
| ----- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------- |
| IQ-01 | Briefings cite supporting timeline events                                 | 2026-08-30 V1 E2E journey 1; briefing ranking tests                       | Evidence |
| IQ-02 | Candidates include evidence/reason/confidence/editable input              | 2026-08-30 V1 E2E journey 2; candidate tests                              | Evidence |
| IQ-03 | System abstains on insufficient evidence/confidence                       | commitment and governed inference unit fixtures                           | Evidence |
| IQ-04 | External content cannot approve or modify policy                          | candidate/action RLS and untrusted-content tests                          | Evidence |
| IQ-05 | Evaluation covers relevant/irrelevant/ambiguous/duplicate/stale/malicious | `tests/fixtures/briefings`, `tests/fixtures/commitments`, inference tests | Evidence |
| IQ-06 | Frozen precision/duplicate/latency/cost thresholds are met                | `V1_LAUNCH_THRESHOLDS.md`, seven-day measurements                         | Blocker  |

## Action and automation safety

| ID    | Criterion                                                    | Evidence route                                           | Status   |
| ----- | ------------------------------------------------------------ | -------------------------------------------------------- | -------- |
| AS-01 | No placeholder handler reports success                       | action engine/contracts and Prompt 18 audit              | Evidence |
| AS-02 | Exact approval required unless explicitly permitted low risk | action migrations/tests; V1 template catalog             | Evidence |
| AS-03 | Idempotency prevents provider-side duplicates                | action receipt tests; 2026-08-30 V1 E2E replay           | Evidence |
| AS-04 | Provider results verified after execution                    | task/calendar/email/workflow outcome tests               | Evidence |
| AS-05 | Failed/partial actions visible and recoverable               | operations snapshot, action UI, automation history tests | Pilot    |
| AS-06 | Revoked consent/permission blocks later execution            | provider credential/action boundary tests                | Evidence |
| AS-07 | Every automation supports enable/disable/dry-run/history     | 2026-08-30 V1 E2E journey 3; `supabase/tests/013`, `014` | Evidence |
| AS-08 | Global pause stops new automation executions                 | 2026-08-30 V1 E2E journey 3; worker pause-race test      | Evidence |
| AS-09 | High-risk effects unavailable autonomously                   | template catalog policy and action engine tests          | Evidence |

## Security and data

| ID    | Criterion                                                        | Evidence route                                                 | Status   |
| ----- | ---------------------------------------------------------------- | -------------------------------------------------------------- | -------- |
| SD-01 | Live schema has tracked baseline and migrations                  | migration manifest/list through `202608300005`                 | Evidence |
| SD-02 | RLS isolates every V1 user-owned table                           | `supabase/tests/004`–`018`; Prompt 18 audit                    | Evidence |
| SD-03 | Service role confined to scoped server/worker paths              | Prompt 18 audit and credential-boundary tests                  | Evidence |
| SD-04 | OAuth secrets absent from client/log/prompt/audit/error payloads | credential migrations, resolver tests, log review              | Evidence |
| SD-05 | External model minimizes content and honors consent              | governed inference authorization/audit tests                   | Evidence |
| SD-06 | Users can view/delete personalization context                    | context substrate/lifecycle tests                              | Manual   |
| SD-07 | Feed/email/document inputs treated as untrusted                  | RSS sanitizer/URL tests, prompt policy, HTML-input disablement | Evidence |
| SD-08 | Rate/concurrency/cost limits cover ingestion/inference/actions   | worker env validation, inference limiter, template limits      | Evidence |

## Reliability and operations

| ID    | Criterion                                                               | Evidence route                                       | Status  |
| ----- | ----------------------------------------------------------------------- | ---------------------------------------------------- | ------- |
| RO-01 | Every required process has production owner/deployment path             | operations runbook and release checklist             | Manual  |
| RO-02 | Heartbeat, queue, lag, dead letters, action/inference failure monitored | protected metrics, snapshot RPC, tracked alert rules | Manual  |
| RO-03 | Jobs survive restarts and safely retry                                  | worker recovery tests and V1 E2E replay              | Pilot   |
| RO-04 | Seven consecutive days avoid silent loss/duplicate effects              | `V1_PILOT_LOG.md`                                    | Blocker |
| RO-05 | Backup/recovery/migration/provider outage behavior documented/exercised | runbook and rollback checklist                       | Manual  |

## Experience

| ID    | Criterion                                                              | Evidence route                                    | Status   |
| ----- | ---------------------------------------------------------------------- | ------------------------------------------------- | -------- |
| EX-01 | Signed-in surface shows changes/priorities/approvals/outcomes/failures | command-center tests and production manual review | Manual   |
| EX-02 | Loading/empty/stale/disconnected/denied/error states understandable    | component tests and V1 E2E partial-failure state  | Manual   |
| EX-03 | Journeys support keyboard/screen reader/mobile/desktop                 | accessibility and viewport release pass           | Manual   |
| EX-04 | Chess/Creative/Memorization/Reading visibly Beta and out of defaults   | V1 release-policy/onboarding tests                | Evidence |
| EX-05 | No unimplemented control presented as functional                       | Prompt 18 audit plus final manual traversal       | Manual   |

## Engineering release gate

| ID    | Criterion                                                         | Evidence route                                            | Status   |
| ----- | ----------------------------------------------------------------- | --------------------------------------------------------- | -------- |
| EG-01 | Targeted lint/type checks pass                                    | Prompt 19 verification log and CI                         | Pilot    |
| EG-02 | Unit tests cover new business logic                               | unit suites and CI                                        | Evidence |
| EG-03 | Integration tests cover adapters/RLS/inference/actions/automation | worker, Vitest, and Supabase test suites                  | Evidence |
| EG-04 | Three required E2E journeys pass                                  | 2026-08-30 deployed run: 3 passed in 22.5 seconds         | Evidence |
| EG-05 | CI checks are required on release branch                          | GitHub API returned HTTP 403 on current private-repo plan | Blocker  |
| EG-06 | Critical/high security findings closed                            | Prompt 18 security audit; daily pilot review              | Pilot    |
| EG-07 | Known limitations documented and V1-consistent                    | `V1_RELEASE_NOTES.md`                                     | Evidence |

## Decision

Current recommendation: **No Go**. Accountable blockers are the release owner:
upgrade GitHub or make the repository public and configure required checks;
upgrade Render worker/queue and connect alert delivery; the implementing agent:
record seven qualifying pilot days; and the human release owner: perform manual
checks and sign the final decision. No implementing agent may self-certify or
merge PR #22.
