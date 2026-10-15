# 002 — Decide V1 Runtime and Information Ownership

Status: Complete

Priority: Critical  
Depends on: None

## Objective

Resolve the architectural ambiguities that would otherwise cause duplicate
workers, stores, and event models. Produce decision-ready proposals and obtain
human approval before schema or worker implementation proceeds.

## Questions to resolve

1. Which process owns durable ingestion, analysis, schedules, and actions?
2. What remains in Next.js, the sync worker, BullMQ workers, n8n, the Python
   service, and the stubbed Go worker?
3. What is the canonical relationship between raw observations, normalized
   timeline events, activity events, context entries, knowledge items,
   insights, candidate actions, jobs, and automation runs?
4. Which records are source-of-truth versus projections for UI/search/model
   context?
5. How are retention, replay, deletion, provenance, and user scoping handled?

## Required investigation

- Trace current worker entrypoints and actual deployment configuration.
- Trace at least email ingestion/action, RSS ingestion, context backfill,
  activity publishing, generic jobs, and n8n callback flows.
- Inventory overlapping tables from generated Supabase types without treating
  the lone migration as ground truth.
- Identify current consumers of `features/context`, `features/knowledge`,
  `features/activity`, `features/news`, `features/actions`, and
  `features/automation`.
- Document what would break if each candidate system became canonical.

## Required deliverables

- A concise current-state diagram.
- A target V1 topology and event lifecycle.
- A responsibility matrix for each service and data concept.
- A migration strategy that preserves existing features and data.
- Decision proposals added in ADR format to
  `docs/agents/workflow/DECISIONS.md`, initially marked Proposed.
- Updates to `ARCHITECTURE.md` only after the decision is accepted.
- Updates to the dependency assumptions in later prompts if needed.

## Recommended starting proposal

Evaluate, but do not blindly adopt, the finalization proposal: one durable
TypeScript/BullMQ worker for internal queues, Supabase as canonical durable
state, Next.js for authenticated UI/API/approval boundaries, Python for
bounded inference, n8n as an optional external workflow adapter, and Go
deferred until a measured requirement exists.

## Stop condition

Do not implement the target architecture or mark this prompt complete until a
human accepts the ownership decisions. If the decision differs from the
starting proposal, revise Prompts 004–018 before handoff.

## Decision package produced

The repository audit, current and target diagrams, responsibility matrices,
replay/retention/deletion rules, rejected alternatives, and migration strategy
are in `docs/finalization/OWNERSHIP_PROPOSAL.md`. ADR-008 through ADR-011 are
recorded as Proposed in `docs/agents/workflow/DECISIONS.md`.

The project owner accepted all five decisions on 2026-08-13. ADR-008 through
ADR-011 are Active, `ARCHITECTURE.md` records the accepted boundaries, and no
target implementation was included in this checkpoint.

## Acceptance criteria

- Every V1 process and record type has one named owner.
- Context, knowledge, activity, and timeline boundaries are unambiguous.
- Replay and deletion behavior is described.
- Deployment responsibility is clear for every required process.
- Human approval is recorded and ADR status is Active before Prompt 004.
