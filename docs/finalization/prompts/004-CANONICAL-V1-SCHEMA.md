# 004 — Implement the Canonical V1 Timeline and Action Schema

Status: Complete
Priority: Critical  
Depends on: 002 and 003 complete with accepted decisions

## Objective

Add the minimum repository-tracked schema needed to trace an authorized source
observation through timeline, insight, candidate action, approval, execution,
and outcome without duplicating existing canonical records.

## Required design

Use the accepted ownership ADR and live-schema audit. Prefer additive,
backward-compatible migrations and projections over destructive table
replacement. Define how existing activity, context, action, automation, and
job records connect to the new lifecycle.

Pending Prompt 002 approval, treat timeline as a new canonical fact model;
keep activity and context as projections and knowledge/domain objects as their
own source truth. Reuse or evolve existing `action_requests`,
`action_results`, `jobs`, and automation records when Prompt 003 confirms they
are viable; do not create parallel ledgers merely to match proposed names.

Each relevant record must support, directly or through an owned relation:

- user ownership and RLS;
- stable source/provider identifiers and idempotency keys;
- provider occurrence time, ingestion time, and update time;
- provenance/source references;
- normalization or policy/model version;
- confidence and expiration for derived records;
- state transitions and failure detail without secrets;
- exact payload version attached to approval; and
- verified outcome and undo/compensation metadata where applicable.

## Required implementation

- Add timestamped migrations with indexes, constraints, foreign keys, and RLS
  policies in the same migration.
- Add typed domain schemas and mapping utilities in their approved ownership
  location; do not create cross-feature imports.
- Implement repository/service operations required to create, query, and
  transition records safely.
- Add retention/deletion behavior required by the accepted decision.
- Add integration tests for lifecycle constraints and cross-user isolation.
- Regenerate Supabase types and reconcile only intended changes.
- Document migration order, rollback limitations, and any required backfill.

## Non-goals

- Do not build feed UI, inference, provider actions, or automation templates.
- Do not migrate all historical data unless separately approved.
- Do not introduce vector storage until a V1 retrieval requirement and
  lifecycle policy are demonstrated.

## Acceptance criteria

- A fixture observation can become a timeline event, insight, candidate
  action, approval, execution, and outcome with complete traceability.
- Duplicate source and execution idempotency keys are rejected or safely
  coalesced.
- Two-user integration tests demonstrate isolation for every new user-owned
  table.
- Derived records cannot outlive or lose their required provenance silently.
- Prompt 005 has stable persistence contracts to consume.

## Completion handoff

Implementation completed on 2026-08-14 and the CLI-backed handoff was
reverified on 2026-08-15. The detailed data model and migration/rollback
contract are documented in
[`../CANONICAL_V1_SCHEMA.md`](../CANONICAL_V1_SCHEMA.md).

### Outcome delivered

WebWidgets has one persisted, user-scoped chain from an authorized source
observation through timeline fact, evidence-backed insight, candidate action,
exact-payload approval, execution attempt, and verified outcome. Shared typed
contracts live in `apps/web/lib/lifecycle/`; no feature imports another
feature. Existing action, result, job, automation, integration, activity,
context, knowledge, and domain ownership remains intact.

### Files and migrations

The implementation landed in commits `6659348d` and `0839aea7`. It added or
reconciled:

- six ordered migrations from `202605300001_context_substrate.sql` through
  `202608140005_canonical_approval_transition.sql`;
- the pgTAP fixture in
  `supabase/tests/004_canonical_lifecycle.test.sql`;
- shared lifecycle schemas, repositories, mappings, hashes, and transitions
  in `apps/web/lib/lifecycle/`;
- live-generated `apps/web/types/supabase.ts`; and
- the repository-pinned Supabase CLI and `supabase/config.toml`.

The unrelated suspended-Chess caller exposed by live type generation was
reconciled to the existing user-owned `chess_studies` contract instead of
adding a nonexistent `game_id` column.

### Verification actually run

Fresh 2026-08-15 handoff verification with Supabase CLI `2.114.0` produced:

- `npx supabase migration list --linked`: 52 local versions, 52 matching
  remote versions, zero mismatches;
- `npx supabase db push --linked --dry-run`: remote up to date, with zero
  migrations, seeds, or roles pending;
- live `public,graphql_public` type generation: repository-formatted output
  exactly matched the committed file at SHA-256
  `921f10e42fa7ac3ae99ebd844f63b11c500896ec3a52e1f634efc8f2b342e4fd`;
- `npx supabase start`: all 52 migrations replayed from an empty local
  database;
- `npx supabase test db`: one pgTAP file, 20 assertions, all successful; and
- `npx supabase stop`: the temporary local stack was stopped after testing.

Repository verification also passed TypeScript compilation, focused ESLint,
and 17 lifecycle/context unit tests. No remote mutation was made during the
2026-08-15 handoff verification.

### Acceptance criteria demonstrated

- The fixture traces observation -> event -> insight -> candidate -> request
  -> result and verifies the completed outcome.
- Duplicate source and request idempotency keys are rejected.
- Two authenticated users are isolated across every new user-owned relation;
  anonymous access and cross-owner writes fail.
- Composite owner/provenance foreign keys and deletion cascades prevent
  derived records from silently losing required evidence.
- Prompt 005 can consume canonical IDs, repositories, job correlation,
  retention, and exact approval transitions without introducing another
  ledger.

### Security and data notes

All new user data has RLS and owner-matched provenance. Import/export child
logs now authorize through their parent job. Approval is an atomic transition
bound to the reviewed payload hash/version and permission snapshot. Retention
purging remains service-role-only, and service-role use stays confined to
server API routes and the dedicated server-only worker boundary.

The migrations are additive. Their only compatibility backfills populate
bounded request/result lifecycle metadata; they do not create historical
candidates or rewrite historical payloads. Provider credential isolation is
still an audited P0 blocker and is not made safe by the lifecycle schema.

### Deployment and rollback

After explicit owner approval, all six migrations were deployed to confirmed
project `webwidgets-dev` (`cvroudtyxsgllivlrayu`). The separate Worldview
project was not linked or changed. The CLI login and link state remain local
and ignored; no credentials are committed.

Rollback after writes begin is forward repair: stop the affected processors,
preserve lifecycle/audit rows, and apply a corrective migration. Dropping
populated lifecycle tables or the new action/job columns would destroy
provenance and idempotency evidence and requires separate approval.

### Remaining blockers and next prompt

ROADMAP maturity now records schema/migration tracking as working and audited,
context as partial pending end-to-end projection proof, and security as
partial with critical credential isolation still open. Worker hosting and
credential isolation remain the material follow-ups.

Prompt 005, **Deploy One Durable V1 Worker Runtime**, is the next available
prompt and all of its Prompt 002/004 prerequisites are satisfied. Prompts
006-008 remain blocked until Prompt 005 provides the real durable processor
runtime.
