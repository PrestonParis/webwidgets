# 005 — Deploy One Durable V1 Worker Runtime

Status: Blocked  
Priority: Critical  
Depends on: 002 and 004

## Objective

Provide one production-deployable worker runtime that actually starts and
processes V1 ingestion, analysis, schedule, and action queues with durable
state, health reporting, retries, and graceful shutdown.

## Required investigation

- Inspect the existing sync-worker, news worker factory, action worker
  factory, generic job runners, n8n integration, Vercel crons, and deployment
  manifests.
- Reuse working queue and token-refresh behavior rather than creating a
  parallel framework.
- Confirm Redis and worker hosting assumptions with the accepted ADR.

## Required implementation

- Create or extend one explicit worker entrypoint that registers only owned V1
  processors and starts them on process boot.
- Define queue names, job schemas, concurrency, retry/backoff, timeouts,
  idempotency, dead-letter behavior, and job retention.
- Persist job/run status in canonical records rather than relying only on
  Redis history.
- Add heartbeat/readiness behavior and structured logs with correlation IDs,
  source IDs, user IDs where appropriate, and no sensitive content.
- Implement graceful shutdown and safe restart behavior.
- Add a documented production deployment path and environment contract.
- Prevent Vercel cron and worker schedules from executing the same recurring
  job twice; retain only the owner selected in the ADR.
- Add integration tests using isolated queues or processor-level harnesses for
  success, retry, duplicate, poison job, and restart scenarios.

## Non-goals

- Do not implement the Go worker.
- Do not make n8n the canonical database or approval state machine.
- Do not add source-specific business logic beyond a small test processor.

## Acceptance criteria

- Starting the deployed process starts the expected workers; no factory is
  left undispatched.
- A queued fixture job survives a worker restart and completes exactly once
  from the product’s perspective.
- Repeated failures enter a visible dead-letter state.
- Readiness fails when required infrastructure is unavailable.
- Deployment and rollback steps are documented and reproducible.
