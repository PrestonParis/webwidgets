# 013 — Execute and Verify Real Task Actions

Status: Complete
Priority: Critical  
Depends on: 004, 005, and 012

## Objective

Replace fake task success with real create, update, and complete behavior
through the unified action engine. Approved commitment candidates must create
exactly one task and record a verified outcome linked back to evidence.

## Required investigation

- Locate the canonical todo/task service and all current task write paths.
- Determine whether `tasks.create` currently targets `todos` or another table
  and align the action contract with real product behavior.
- Inspect action queue serialization, approval context, lifecycle events, and
  current undo semantics.

## Required implementation

- Implement typed `tasks.create`, `tasks.update`, and `tasks.complete` action
  definitions and real local-domain handlers.
- Remove `local.echo` from state-changing task actions.
- Require exact-payload approval and current user authorization.
- Derive stable idempotency keys from candidate/action identity and prevent
  double approval, worker retry, and client retry from creating duplicates.
- Execute queued actions through the durable worker while preserving Supabase
  context needed for lifecycle persistence.
- Read the created/updated task back after execution and record provider/local
  ID, verified state, timestamps, and outcome.
- Implement safe undo/compensation for create/update where existing task
  semantics support it; document limitations for completion reversal.
- Update originating candidate, timeline event, and action history without
  creating feedback loops.
- Expose validation, permission, stale approval, conflict, retrying, completed,
  partially failed, and failed states to the user.
- Add integration tests for all three actions, cross-user access, duplicate
  delivery, stale approval, concurrent edit, worker retry, verification
  failure, and undo.

## Acceptance criteria

- Approving one candidate creates one real task and returns its verified ID.
- Updating and completing the task changes canonical state and outcome.
- Replaying any request does not create a second task or duplicate outcome.
- Placeholder success is impossible for task actions.
- The evidence → candidate → approval → execution → task → outcome chain is
  queryable and visible.

## Completion handoff

Completed on 2026-08-27. Exact candidate approval now materializes one
approved `action_requests` row and enqueues an `action.execute` job on the
durable worker. A service-only atomic database function creates, updates, or
completes the canonical `todos` row, reads it back, and records one verified
`action_results` outcome. Unique candidate-version, action-request, product
receipt, and result keys make browser retries, duplicate approvals, BullMQ
redelivery, and worker retries converge on the same task and outcome.

The UI exposes queued/running/failed/completed state, verified task ID, safe
retry, and create/update compensation. Completion reversal is explicitly
unavailable. Owner checks, exact payload bindings, optimistic timestamps,
worker-only mutation privileges, and database/worker tests cover stale,
cross-owner, duplicate, conflict, retry, malformed verification, and undo
boundaries.
