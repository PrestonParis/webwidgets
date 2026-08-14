# WebWidgets V1 Delivery Plan

## Execution principle

Work in vertical slices. Each slice must connect a real source to a real user
outcome and include persistence, safety, observability, and tests. Do not
declare a layer complete because its interfaces or UI exist.

## Workstream 0: Scope and ownership lock

### Deliverables

- Adopt `V1_SCOPE.md` as the active V1 product contract.
- Record architecture decisions for runtime ownership and the
  context-versus-knowledge boundary.
- Inventory all routes, widgets, recommendations, navigation entries, and
  runtime manifests affected by the suspended beta decision.
- Mark Chess, Creative, Memorization, and Reading as beta and remove them
  from default onboarding/generated workspaces.
- Convert placeholder success paths into explicit unavailable states.
- Create a V1 issue board organized by the release gates in this document.

### Exit gate

No active V1 task adds feature breadth, and every critical subsystem has one
documented owner.

## Workstream 1: Data safety and schema baseline

### Deliverables

- Generate the live Supabase schema and establish a tracked migration
  baseline without destroying existing data.
- Audit RLS for every V1 user-owned table and add missing policies through
  tracked migrations.
- Define canonical timeline, insight, candidate-action, approval, execution,
  and outcome records.
- Define data retention, deletion, provenance, confidence, and expiration.
- Resolve duplicate/overlapping activity, context, knowledge, news-event,
  action-event, automation-run, and jobs concepts.
- Add contract and RLS-sensitive integration tests.

### Exit gate

A test user cannot read another user’s V1 records, and one sample event can
be traced from source observation through outcome using repository-tracked
schema.

## Workstream 2: Continuous timeline ingestion

### Deliverables

- Deploy one durable worker runtime with health checks and graceful shutdown.
- Start the existing news and action workers from a production entrypoint or
  consolidate their behavior into the chosen worker.
- Complete source health, cursors, retry, idempotency, and dead-letter
  handling.
- Persist Gmail/Outlook, calendar, task, note/document, activity, and selected
  RSS/Atom events into the normalized timeline.
- Replace the empty news feed API with a user-scoped timeline query.
- Replace the empty NewsAPI adapter with user-selected RSS/Atom ingestion;
  remove the mainstream news-provider dependency from V1.
- Implement URL/content deduplication and related-story clustering.
- Show source health and last successful sync to the user.

### Vertical slice

User adds an RSS feed, a new item is fetched once, stored with provenance,
appears on the timeline, and a failed subsequent sync is visible without
removing the existing item.

### Exit gate

All V1 sources ingest for seven consecutive days in staging without silent
data loss or uncontrolled duplication.

## Workstream 3: Briefing and candidate-action intelligence

### Deliverables

- Implement real external LLM adapters behind the existing provider registry,
  with consent, redaction, timeout, cost, and audit controls.
- Connect only the ML endpoints that have a defined V1 consumer; mark or
  remove neutral-placeholder scoring from production decision paths.
- Retrieve relevant goals, projects, tasks, preferences, and recent outcomes
  for each analysis job.
- Score timeline events for relevance, novelty, urgency, confidence, and
  actionability.
- Generate evidence-linked daily/on-demand briefings.
- Extract candidate commitments and deadlines with an abstain path.
- Add approve, edit, dismiss, and “incorrect” feedback.
- Build a repeatable evaluation dataset from synthetic/redacted scenarios.

### Vertical slice

An email containing a dated commitment produces one editable task suggestion
with a link to the source, a reason, and confidence. An irrelevant email
produces no suggestion.

### Exit gate

The briefing and commitment detector meet agreed precision, duplicate, and
latency thresholds on the evaluation set and a staging pilot.

## Workstream 4: Real task and calendar completion

### Deliverables

- Implement real `tasks.create`, task update, and task completion handlers.
- Implement the real calendar event provider handler.
- Implement email drafting without sending.
- Implement workflow triggering through the existing validated n8n boundary.
- Add idempotency, exact-payload approval, execution receipts, verification,
  retries, compensating/undo behavior where possible, and visible failures.
- Ensure queued workers preserve the execution context needed for audit and
  persistence.

### Vertical slice

The user approves a detected commitment, WebWidgets creates exactly one task,
the user completes it, and the originating suggestion and timeline show the
verified outcome.

### Exit gate

The five V1 action types perform real work, never claim fake success, and pass
integration tests covering duplicate delivery, expired approval, revoked
permission, provider failure, and retry.

## Workstream 5: Basic automation

### Deliverables

- Replace empty Automation Center service methods with persisted behavior.
- Implement trigger, condition, approval, action, run, and outcome state.
- Ship the four templates in `V1_SCOPE.md`.
- Add dry-run, enable/disable, pause-all, rate limits, cost limits, run
  history, and dead-letter recovery.
- Prevent external content or model output from modifying automation policy.
- Make automation failures actionable from the command center.

### Vertical slice

The daily briefing automation runs at the configured time, produces one
reviewable briefing, records its inputs and result, and shows a clear failure
if a source or model is unavailable.

### Exit gate

Each template runs reliably in staging, is understandable without logs, and
can be stopped immediately by the user.

## Workstream 6: Command-center product surface

### Deliverables

- Make the primary signed-in surface answer:
  - What changed?
  - What matters now?
  - What needs my approval?
  - What should I do next?
  - What did WebWidgets complete?
  - What failed?
- Integrate timeline, briefing, tasks, approvals, automations, and outcomes.
- Keep manual widgets available but subordinate to the primary decision flow.
- Remove orphaned critical routes and dead controls from V1 journeys.
- Ensure responsive, dark-mode, keyboard, screen-reader, loading, empty, and
  error behavior.

### Exit gate

A new user can complete all three required journeys without navigating to an
admin/developer surface or understanding the worker architecture.

## Workstream 7: Release hardening

### Deliverables

- Security review: RLS, OAuth scopes, token handling, rate limiting, prompt
  injection, sanitization, audit logs, consent, export, and deletion.
- Fix the known conversion HTML sanitization gap if conversion remains
  reachable in the V1 deployment; otherwise disable the unsafe path.
- Add queue-depth, worker-heartbeat, sync-lag, failure-rate, inference-cost,
  action-success, and briefing-quality monitoring.
- Add E2E coverage for the three required journeys.
- Repair misleading/broken test scripts and require CI checks through branch
  protection.
- Remove or disable fake, empty, and unimplemented production paths.
- Run a small staging pilot and resolve launch-blocking findings.

### Exit gate

All criteria in `V1_ACCEPTANCE.md` pass, with documented evidence and no
critical security, data-loss, or fake-success issue open.

## Suggested order

Workstreams 0 and 1 are prerequisites. After the event contract exists,
Workstream 2 should deliver one RSS vertical slice while Workstream 3 builds
the evaluation harness. Workstream 4 follows the first candidate-action
slice. Workstream 5 depends on real actions. Workstreams 6 and 7 integrate and
harden the result.

The critical path is:

```text
scope -> schema/RLS -> durable timeline -> candidate task
      -> real task execution -> bounded automation -> command center -> V1
```

## Progress reporting

Track outcomes rather than file counts. A weekly finalization report should
include:

- sources syncing successfully;
- timeline event lag and duplicate rate;
- briefing usefulness feedback;
- candidate-action precision and dismissal rate;
- approved action success and duplicate-execution rate;
- automation success/failure/paused counts;
- unresolved security or RLS findings; and
- release gates passed or blocked.
