# Target V1 Product Loop

## The loop

```text
Authorized sources
  -> raw observations
  -> normalization and deduplication
  -> user timeline
  -> context retrieval
  -> relevance and commitment analysis
  -> briefing, insight, or candidate action
  -> policy and approval
  -> action execution
  -> verification and outcome
  -> feedback and future ranking
```

The system should be event-driven. A “24/7 agent” means durable workers wake
when events or schedules require work; it does not mean an LLM continuously
runs without a bounded job.

## Canonical record types

The implementation should converge on the following conceptual records.
Exact tables and ownership require an ADR and tracked migration work.

| Record              | Purpose                                                            |
| ------------------- | ------------------------------------------------------------------ |
| Source connection   | Authorization, sync state, cursor, and health for one source       |
| Raw observation     | Immutable provider payload or a privacy-preserving reference to it |
| Timeline event      | Normalized user-scoped fact with timestamps and provenance         |
| Entity/context link | Relationship to a goal, project, person, topic, or task            |
| Insight             | Derived conclusion with evidence, confidence, and expiration       |
| Candidate action    | Typed proposed action and editable input                           |
| Approval            | User or policy decision attached to the exact action version       |
| Execution           | Idempotent attempt, provider receipt, status, and error            |
| Outcome             | Verified result, undo information, and user feedback               |

All derived records need source references, model/rule version, creation time,
confidence, and user ownership. Time-sensitive conclusions need expiration.

## Ingestion boundary

Every source adapter must provide:

- stable source and event identifiers;
- cursor or watermark handling;
- idempotent writes;
- rate-limit and retry behavior;
- last-success and last-error state;
- deletion/revocation handling; and
- normalized provenance.

RSS/Atom ingestion must additionally provide canonical URL normalization,
content-hash deduplication, source labeling, and story clustering. User-added
feeds should be removable and should stop fetching after removal.

## Intelligence boundary

Use the least complex dependable method for each step:

- deterministic code for permissions, dates, idempotency, and policy;
- rules and small models for cheap filtering, routing, classification, and
  scoring;
- an LLM for synthesis, ambiguity resolution, explanation, and bounded plan
  generation; and
- retrieval from the user-owned context store rather than sending the entire
  history to a model.

The intelligence layer must be able to abstain. Low-confidence findings
remain timeline items or drafts; they do not become actions automatically.

## Autonomy levels

| Level           | Behavior                               | V1 default                                  |
| --------------- | -------------------------------------- | ------------------------------------------- |
| Observe         | Store and display timeline events      | Allowed                                     |
| Suggest         | Produce an insight or candidate action | Allowed                                     |
| Prepare         | Fill an editable task, event, or draft | Allowed                                     |
| Approve and run | Execute after explicit user approval   | Required for state changes                  |
| Auto-run        | Execute under a user-configured policy | Limited to low-risk templates after dry-run |

Email sending, deletion, financial transactions, publishing, and permission
changes remain outside V1 auto-run.

## Action contract

An action is not complete when a queue accepts it. It is complete only when:

1. its input validates;
2. permissions and consent are current;
3. the approval applies to the exact payload;
4. an idempotency key prevents duplicate execution;
5. a real provider or local-domain handler performs the work;
6. the result is verified by reading the created/updated record;
7. the user sees the outcome or failure; and
8. the audit trail contains no secret or unnecessary source content.

Placeholder provider handlers must return an explicit unavailable/failure
result. They must not return `accepted: true`.

## Runtime ownership proposal

Use one durable TypeScript worker and BullMQ/Redis for the internal ingestion,
analysis, and action queues. Use provider webhooks where possible and polling
as a fallback. Keep Supabase as the durable product record.

- Next.js: authenticated UI, API boundaries, previews, approvals, and reads.
- Durable worker: source sync, enrichment, analysis, schedules, retries, and
  action processing.
- Supabase: canonical user-scoped state, audit history, and RLS.
- Python ML service: bounded prediction endpoints that have live consumers.
- n8n: optional external workflow adapter, not the canonical state machine.
- Go worker: deferred unless a measured V1 requirement justifies it.
- MCP: added only for a named integration whose resource/tool interface is
  clearer than the existing connector boundary.

This ownership proposal must become an architecture decision before major
worker implementation begins.

## Safety requirements

- content from email, documents, and feeds is untrusted input;
- retrieved content cannot change system policy or approve actions;
- model output is validated against typed schemas;
- sensitive content is minimized before external-model calls;
- users can inspect and delete stored context;
- automation has per-user rate and cost limits;
- every automation has a pause switch;
- repeated failures move to a visible dead-letter state; and
- disabling or revoking an integration stops future processing.
