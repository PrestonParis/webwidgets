# 005 — Deploy One Durable V1 Worker Runtime

Status: Awaiting approval
Priority: Critical  
Depends on: 002 and 004

## Objective

Provide one production-deployable worker runtime that actually starts and
processes V1 ingestion, analysis, schedule, and action queues with durable
state, health reporting, retries, and graceful shutdown.

Pending Prompt 002 approval, extend `services/sync-worker` as that runtime.
Supabase persists lifecycle truth and BullMQ/Redis provides at-least-once
delivery. Do not create another worker package unless the ownership decision
is explicitly revised.

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

## Implementation handoff

Repository implementation completed on 2026-08-15. The runtime and operations
contract is documented in
[`../V1_WORKER_DEPLOYMENT.md`](../V1_WORKER_DEPLOYMENT.md).

### Outcome delivered

- One explicit entrypoint starts the four owned V1 BullMQ consumers.
- Queue deliveries must match a user-scoped canonical `jobs` receipt before
  processing.
- Running, retry, completion, safe failure, and dead-letter state persist in
  Supabase rather than relying on Redis retention.
- Readiness requires Redis and Supabase; liveness, dependency heartbeat,
  structured content-minimized logs, processor timeouts, and bounded graceful
  shutdown are implemented.
- Existing email workers now load provider credentials only after a scoped
  `(user_id, account_id)` lookup and no longer place email addresses in queue
  payloads or logs.
- The two undispatched web-bundle news/action worker factories were removed;
  their legacy producers fail closed until their canonical processors land.
- `render.yaml` selects one free Render Docker web service running the worker
  process and one free, non-persistent `noeviction` Render Key Value instance.
  The default deployment is dark; ADR-014 retains the paid background-worker
  and persistent-queue production target.

### Verification

- `npm run typecheck` in `services/sync-worker`: passed.
- `npm test` in `services/sync-worker`: 9 tests passed. The processor harness
  covers success, restart/duplicate coalescing, retry, poison jobs,
  max-attempt dead letter, dependency readiness, queue registration, and
  schedule-owner validation.
- `npm run format:check` in `services/sync-worker`: required before commit.
- Temporary local Supabase + Redis runtime smoke: four consumers started;
  readiness returned 200; one canonical probe completed; the same idempotency
  key left exactly one completed `jobs` row; Redis loss changed readiness to
  503; Redis restoration recovered readiness to 200; SIGINT closed the health
  server and all consumers cleanly. Both temporary services were stopped.

### Deployment gate

The free compatibility Blueprint is ready to provision without paid service
instances. Prompt 005 remains `Awaiting approval` until the Blueprint is
provisioned, `/ready` confirms Redis and Supabase connectivity, two healthy
heartbeats are observed, and the canonical runtime probe completes. Free web
services can sleep and free Key Value is non-persistent, so this evidence is a
development gate rather than production-readiness proof.

Prompt 006 remains blocked until that deployment evidence is added here.
