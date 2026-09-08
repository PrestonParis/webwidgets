# V2 executable capability inventory

Audit date: 2026-09-06  
Source revision: `8a2b6357` (`origin/finalization`)  
Machine-readable companion: `2026-09-06-v2-capability-inventory.json`

## Result

WebWidgets has a real, safety-oriented V1 execution spine, but its product catalogs are not a reliable statement of what can execute. The durable TypeScript worker and protected Next.js provider routes support tasks, Google Calendar writes, Gmail/Outlook drafts and separately approved sends, configured n8n workflows, RSS/provider ingestion, briefings, and four bounded automation templates. The Action Catalog, widget synthesis registries, deliverable scheduler, integration outcomes, and Go endpoints collectively overstate that spine.

The release rule for V2 must be: a capability is executable only when the same identifier has a reachable executor, authorization boundary, input validation, idempotency policy, observable side effect, verification receipt, tests, and a declared production dependency. UI presence, a stored definition, a queue acknowledgement, or a `safe: true` field is not execution.

## Classification summary

| Surface                      |                                    Inventory | Finding                                                                      |
| ---------------------------- | -------------------------------------------: | ---------------------------------------------------------------------------- |
| Canonical platform actions   |                                            9 | 5 core executable, 3 beta executable, 1 placeholder                          |
| Bounded automation templates |                                            4 | 4 core executable; stale-task wording exceeds its dashboard-only delivery    |
| n8n workflow keys            |                                            7 | Beta executable when n8n is configured; not individually advertised          |
| Provider/integration paths   |                                           12 | 4 core, 1 beta, 1 internal/lab, 6 placeholders                               |
| Scheduled deliverables       | 1 generic capability, 5 destination variants | Persistence-only; no due-job claimant, generator, or destination verifier    |
| Go worker handlers           |                                            3 | Validation plus in-memory acknowledgement/logging only; all placeholders     |
| Widget synthesis actions     |                                           26 | 25 persistence-only and 1 explicit placeholder; no action executor           |
| Widget synthesis automations |                                            7 | All placeholders; no scheduler mapping                                       |
| Widget transformations       |                                           25 | 21 persistence-only and 4 explicit placeholders; preview does not apply them |

## What is genuinely executable

The canonical action lifecycle is the strongest part of the product. The TypeScript worker looks up an owned approved request, evaluates the global automation guard, dispatches local task mutations or protected provider routes, and requires a validated receipt. Database functions provide ownership, state transitions, and unique idempotency constraints. Provider routes require a timing-safe worker token and feature flags, while adapters reserve and reconcile provider dispatches.

The four V1 templates are also real: commitment capture and calendar preparation scan eligible candidates; daily briefing and stale-task review use timezone-aware schedules; triggers are deduplicated; pause and approval controls are enforced. Daily briefing enqueues a durable analysis job. Calendar preparation reaches the canonical calendar executor after approval.

Gmail, Google Calendar, Microsoft mail/calendar internals, and RSS have actual ingestion/execution paths. GitHub is a read-only beta connector backed by a server integration key, not the broad workflow described by its outcome copy.

## False or misleading surfaces

### Platform Action Catalog

The UI states that registered actions are “available to widgets, agents, and automations.” That is not true of the generic invocation route. All queue-required definitions call `enqueueActionJob`, which deliberately returns `null`; direct provider handlers deliberately fail unless a canonical approved request already exists. The task/provider action IDs do have real executors elsewhere, but the advertised catalog does not connect to those proposal, approval, and materialization paths.

`system.generate_briefing` is the clearest false success: its handler is `local.echo`, so it can report completion without generating a briefing. It must be removed or bound to the canonical `briefing.generate` job.

### Widget builder and synthesis

The widget builder can select and persist 26 action definitions and seven automation definitions. Assembly validates registry membership and permission labels; no runtime dispatches those IDs. Likewise, the 25 transformation records are searchable metadata. `validateTransformationConfig` only checks for keys, the preview engine creates sample data, and the renderer displays the first source without applying any transformation.

The four names ending in `_placeholder` and `api.custom_action_placeholder` are explicit temporary implementations exposed through registries. They must be removed from user-visible selection immediately; the remaining metadata must be labeled design-only until real runtimes exist.

### Deliverables

Automation Center lets a user schedule, enable, and select a destination for summaries, reports, digests, briefings, and exports. The server only inserts or updates `automation_deliverables`. No worker scans due rows, generates the output, delivers it, or verifies receipt. “Schedule deliverable,” “Next,” and destination language therefore overstate persistence as execution.

### Integrations

Gmail promises automatic task creation, and Google Calendar promises reminders and task-deadline synchronization, but those exact outcomes have no corresponding provider handlers. GitHub promises stale-branch/review surfacing and task linkage beyond its read connector. Coming-soon providers are visually classified correctly, but should not occupy primary discovery with outcome promises.

The Google Sheets lint-report integration added to repository operations is not a WebWidgets product connector and must not be used as evidence that the product card executes.

### Go worker

The Go service accepts event-ingest, cache-write, and snapshot-precompute requests into process-local channels. Consumers log the payload and increment counters. They do not authenticate callers, write durable state, deduplicate, recover after restart, or verify an external effect. A queued or accepted response can therefore be mistaken for completed work. These endpoints are internal placeholders and must remain disconnected from product claims until V2 supplies durable implementations.

## Required follow-up issues

These are intentionally split by ownership so implementations do not overlap.

1. **Actions — unify catalog and canonical dispatch.** Make action metadata derive from the canonical request lifecycle. Generic invocation must create a validated proposal/request or refuse the ID. Remove `local.echo` for briefing generation. Owner: `apps/web/features/actions` plus the narrow worker client boundary.
2. **Widget runtime — implement or hide synthesis actions.** Hide action selection and action-bearing generated widgets until each synthesis ID maps to a canonical action ID with its gates and receipts. Owner: widget synthesis/builder only.
3. **Widget runtime — execute transformations.** Build a deterministic, typed transformation runtime with fixtures for each shipped transform; remove the four placeholders until governed model implementations exist. Owner: widget synthesis only.
4. **Automation — deliverable execution.** Add a due-row claimant, output generator, destination adapters, idempotency key, run/attempt ledger, and verified receipt. Until complete, disable enable/schedule controls and describe saved rows as drafts. Owner: Automation Center plus TypeScript worker.
5. **Integrations — correct discovery claims.** Rewrite Gmail, Calendar, and GitHub outcomes to match existing handlers; move placeholder providers out of primary discovery. Owner: onboarding/integrations UI only.
6. **Go — durable event ingestion.** Authenticate ingestion, persist an inbox/ledger, deduplicate, expose lag/dead-letter metrics, and prove restart recovery. Owner: Go worker; no widget/snapshot changes in the same PR.
7. **Go — cache and snapshot execution.** After event durability lands, implement a real cache backend and deterministic snapshot jobs with read-after-write verification. Owner: Go worker, serialized after issue 6.
8. **Release enforcement — capability contract test.** Add CI that fails when an advertised executable capability lacks its handler, verifier, test reference, or production dependency. Owner: release tooling; consumes the machine-readable inventory without changing runtime code.

## V2 exit gate

V2 cannot call the product “more automatic” by adding registry entries. It can only expand after the capability-contract test passes, all enabled deliverables are worker-owned and verified, synthesis applies real transformations, and the Go worker persists and recovers real work. Until then, the UI must expose only the bounded V1 automation templates and canonical action flows as executable.
