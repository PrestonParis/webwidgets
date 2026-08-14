# 004 — Implement the Canonical V1 Timeline and Action Schema

Status: Blocked  
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
