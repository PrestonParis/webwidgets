# Canonical V1 Lifecycle Schema

Status: Deployed to `webwidgets-dev`

Implemented: 2026-08-14

Decision basis: ADR-008 through ADR-012 and Prompt 003 live-schema audit

## Outcome

The repository now has one traceable persistence chain:

```text
integration connection
  -> raw observation
  -> timeline event
  -> insight + evidence links
  -> candidate action
  -> existing action request
  -> existing action result
```

`activity_events` and context remain downstream projections. Domain and
knowledge records remain their own source truth. `jobs` and `automation_runs`
correlate delivery and orchestration but do not copy approval or provider
outcome truth.

## Ownership and invariants

All five new tables carry `user_id`, have RLS enabled, grant no access to
`anon`, and use authenticated owner policies. Every provenance foreign key is
composite with `user_id`, so knowing another user's UUID cannot create a
cross-owner relation.

| Record                    | Durable responsibility                          | Idempotency / provenance                                                    |
| ------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `raw_observations`        | Minimized provider evidence and replay identity | Unique owner-scoped source key; optional owner-matched connection           |
| `timeline_events`         | Canonical normalized fact and revision          | One logical event key; required observation with cascading deletion         |
| `insights`                | Expiring model interpretation                   | Model/policy version, content hash, confidence, required primary event      |
| `insight_timeline_events` | Additional supporting or contradicting evidence | Owner-matched insight and timeline foreign keys                             |
| `candidate_actions`       | Expiring proposal that cannot execute itself    | Policy/payload version and hash; required insight                           |
| `action_requests`         | Existing approval and execution command ledger  | Exact payload receipt, permission snapshot, optional job/automation links   |
| `action_results`          | Existing attempt and verified outcome ledger    | Attempt and execution keys, provider receipt, verification and compensation |
| `jobs`                    | Persisted worker correlation                    | Queue identity, attempts, dead letter, diagnostic expiry                    |
| `automation_runs`         | Typed action orchestration                      | Trigger event, job, policy, and run idempotency references                  |

Approvals use `decide_action_request`, an authenticated, atomic database
transition. Approval fails if the payload JSON, hash, version, permission
snapshot, or current approval state changed. A result is only reflected as a
completed request when its outcome is explicitly verified.

## Shared persistence contracts

Prompt 005 and later work should consume `apps/web/lib/lifecycle/` rather than
importing between features. It provides:

- Zod input and record schemas;
- stable JSON hashing and source/timeline idempotency builders;
- observation, timeline, insight, candidate, request, approval, result, and
  trace repositories; and
- row-to-domain mapping that validates database output.

Source processors should persist the observation before acknowledging queue
work, then normalize it into the timeline. Queue payloads carry canonical IDs
and deterministic keys, not private source bodies.

## Migration and deployment order

Apply only after review in this order:

1. `202605300001_context_substrate.sql` — reconciled local context successor;
2. `202608140001_secure_import_export_job_logs.sql` — P0 parent-owner RLS;
3. `202608140002_canonical_timeline.sql` — source health and new lifecycle
   tables;
4. `202608140003_canonical_action_job_contracts.sql` — additive evolution of
   existing ledgers;
5. `202608140004_canonical_retention.sql` — service-role retention operation;
6. `202608140005_canonical_approval_transition.sql` — exact-payload approval.

The complete 52-migration chain replayed successfully from an empty local
Supabase database. After an owner-approved CLI dry run identified exactly the
six successors above, they were applied to `webwidgets-dev` on 2026-08-14.
Local and remote migration history now align at all 52 versions.

The action migration performs two bounded compatibility backfills: legacy
requests receive `requested_at = created_at` and payload version `1`; legacy
results receive their parent owner, a success/failure status, and a stable
attempt number. It does not create candidates for historical rows or rewrite
historical payloads.

## Retention and deletion

`purge_expired_v1_lifecycle` is executable by `service_role` only and is meant
for Prompt 005's reviewed maintenance processor. It clears normalized raw
payload after 30 days, clears expired derived/action content, removes expired
job diagnostics, and deletes timeline events at 365 days. Hashes, state, and
content-minimized receipts remain where the accepted policy requires them.

Disconnecting a source preserves normalized history because deleting a
connection nulls only the connection reference. An explicit remove-imported-
data operation deletes the matching raw observations; database cascades then
remove timeline events, insights, evidence links, and candidates. Existing
action approval/result receipts survive with their candidate reference set to
null and private content subject to the 365-day purge.

## Rollback limitations

These migrations are additive and should use forward repair after deployment.
Do not drop populated lifecycle tables as a routine rollback. A pre-deployment
rollback can omit the five new migrations. After writes begin, disable the
new worker processors, preserve the records, and ship a corrective migration.
Removing the new columns from shared action/job tables would destroy audit and
idempotency data and requires a separately approved data migration.

## Verification and generated types

The pgTAP fixture passed 20 assertions against real RLS. It covers two users
on every new table, append-only import/export logs, duplicate observation and
request keys, exact approval, verified outcome tracing, and source deletion
cascades. Unit tests cover schema defaults, deterministic hashes, approval
receipts, and verified timestamps.

Types were regenerated directly from the deployed `webwidgets-dev` schemas
and committed as a mechanical artifact. The formatted output SHA-256 is
`921f10e42fa7ac3ae99ebd844f63b11c500896ec3a52e1f634efc8f2b342e4fd`.
Live generation exposed a suspended-Chess caller that referenced a nonexistent
`chess_studies.game_id`; that caller now follows the existing user-owned study
contract instead of inventing a new database column.
