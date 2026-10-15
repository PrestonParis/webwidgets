# V1 Worker Deployment and Operations

Status: Free finalization path implemented; Render provisioning pending

Implemented: 2026-08-15

Decision basis: ADR-008, ADR-010, ADR-011, ADR-013, ADR-014, and ADR-015

## Outcome

`services/sync-worker` is the single V1 background runtime. One process starts
the ingestion, analysis, schedule, and action BullMQ consumers, optional legacy
email consumers, readiness and liveness endpoints, periodic dependency
heartbeats, and graceful shutdown handling.

Supabase `jobs` rows are durable truth. Redis contains delivery state only.
Every V1 delivery carries a canonical job ID, owner ID, correlation ID,
idempotency key, queue kind, and versioned task. The runner verifies that
identity before claiming work and persists running, retry, completion, or
dead-letter state before BullMQ acknowledges the attempt.

## Supported finalization topology

Render is the selected V1 container host. The repository-root `render.yaml`
defines one free Docker web service running the worker process and one free,
private Render Key Value instance with `noeviction` and persistence disabled.
The web service exposes only liveness/readiness and exists because Render does
not offer free background workers. Render supports Docker web services,
private Key Value connection strings, health checks, and SIGTERM handling:

- [Render free instances](https://render.com/docs/free)
- [Render web services](https://render.com/docs/web-services)
- [Render background workers](https://render.com/docs/background-workers)
- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
- [Render Docker deployments](https://render.com/docs/docker)

This compatibility topology is for finalization and integration testing. A
free web service can sleep after inactivity, and free Key Value can lose its
delivery state on restart. Supabase remains durable job truth, but delivery may
need to be re-enqueued. Production must cut over to ADR-014's paid background
worker and persistent Key Value; it must not relabel this free deployment as
continuous or production-safe automation.

Free web services do not support `maxShutdownDelaySeconds`. The Blueprint
therefore omits that field and bounds the process's own shutdown timeout to 25
seconds, below Render's default termination window. Production can restore the
120-second host delay during the ADR-014 cutover.

## Queue and execution contract

| Queue          | Initial concurrency | Prompt 005 processor                                                     |
| -------------- | ------------------: | ------------------------------------------------------------------------ |
| `v1-ingestion` |                   4 | Versioned runtime probe; source processors arrive in Prompts 006-008     |
| `v1-analysis`  |                   4 | Versioned runtime probe; governed inference arrives in Prompt 010        |
| `v1-schedule`  |                   1 | Versioned runtime probe; durable schedules extend this registry          |
| `v1-action`    |                   2 | Exact-approved local task execution; connector actions arrive in Prompt 014 |

The probe is a real persisted smoke operation with no provider side effect. An
unsupported task fails explicitly; it is never reported as successful.
Processors have a two-minute default timeout, three exponential-backoff
attempts, 30-day successful diagnostics, and 90-day failed/dead-letter
diagnostics. The canonical row's `max_attempts` remains authoritative.

## Environment contract

| Variable                    | Required    | Purpose                                                          |
| --------------------------- | ----------- | ---------------------------------------------------------------- |
| `SUPABASE_URL`              | yes         | Confirmed WebWidgets Supabase project URL                        |
| `SUPABASE_SERVICE_ROLE_KEY` | yes, secret | Server-only worker credential; never expose to web code or logs  |
| `REDIS_URL`                 | yes, secret | Render Key Value private connection string                       |
| `V1_QUEUES_ENABLED`         | no          | Starts the four V1 consumers; defaults to `true`                 |
| `WORKER_DRY_RUN`            | no          | Render sets `false` after the Prompt 006 RSS persistence cutover |
| `EMAIL_SYNC_ENABLED`        | no          | Defaults to `false`; requires all provider client credentials    |
| `SCHEDULE_OWNER`            | no          | `vercel` or `worker`; defaults to `vercel` during dark launch    |
| `HEALTH_PORT`               | no          | Internal liveness/readiness port; defaults to `10000`            |
| `HEARTBEAT_INTERVAL_MS`     | no          | Redis/Supabase dependency heartbeat interval                     |
| `JOB_TIMEOUT_MS`            | no          | Bounded processor execution time                                 |
| `SHUTDOWN_TIMEOUT_MS`       | no          | Free Blueprint uses 25 seconds, below Render's default window    |
| `SYNC_BATCH_SIZE`           | no          | Bounded existing email snapshot batch size                       |
| `SYNC_INTERVAL_MINUTES`     | no          | Email schedule interval after worker cutover                     |

Provider client IDs/secrets and tenant configuration are required only when
email sync is enabled. The committed `.env.example` contains placeholders,
never values.

## Readiness, heartbeat, and logs

`GET /live` returns success until shutdown begins. `GET /ready` returns 200
only when Redis responds to `PING` and the canonical `jobs` table is reachable
through the worker client; it returns 503 otherwise. The Docker image carries
the same readiness probe as a container health check.

The free web-service compatibility deployment exposes `/live` and `/ready` at
its Render URL. The runtime also performs the readiness check every 30 seconds
and emits a structured heartbeat containing only instance/dependency status.
Job logs include job, user, correlation, queue, safe failure code, and attempt
identifiers; they do not include tokens, emails, source bodies, payloads, or
raw provider errors.

## Dark deployment procedure

1. In Render, create or sync a Blueprint from the `finalization` branch and
   repository-root `render.yaml`.
2. Before confirming creation, verify both detected resources say `Free`:
   `webwidgets-v1-worker` must be a Web Service and
   `webwidgets-v1-queue` must be Key Value. Stop if Render shows `Starter`.
3. Supply `SUPABASE_URL` for `webwidgets-dev` and its service-role credential
   through Render's secret prompt. Do not use the Worldview project.
4. The first runtime probe used `WORKER_DRY_RUN=true`. Prompt 006 changes it to
   `false` so RSS observations persist; email remains disabled and
   state-changing action processors are not registered.
5. Open `https://<service>.onrender.com/ready`; after any cold start it must
   report `ready`, `redis`, and `supabase` as true.
6. Confirm the startup log reports four V1 workers, dry-run mode, and ready
   Redis/Supabase dependencies. Confirm at least two successful heartbeats.
7. Because free services do not provide shell access, run the canonical probe
   locally using a temporarily IP-restricted external Key Value URL. Re-run it
   with the same idempotency key and confirm it returns the existing canonical
   completion rather than producing a second product result. Remove external
   Key Value access immediately afterward.

No provider polling or provider action is enabled by this procedure.

The same procedure was proven locally on 2026-08-15 against temporary real
Supabase and Redis services: four consumers started, readiness passed, one
canonical probe completed, duplicate enqueue preserved one completion, Redis
loss failed readiness, Redis restoration recovered it, and SIGINT shut the
runtime down cleanly. The temporary services were stopped afterward.

## Schedule cutover invariant

Prompt 005 deploys dark while Vercel remains the temporary schedule owner.
When `SCHEDULE_OWNER=vercel`, startup removes both legacy and new BullMQ email
schedulers so a stale Redis scheduler cannot overlap Vercel.

Email/calendar cutover in Prompt 007 must be one reviewed change: first remove
the matching Vercel cron entries, then set `EMAIL_SYNC_ENABLED=true` and
`SCHEDULE_OWNER=worker` in `render.yaml`. The environment schema rejects worker
schedule ownership while email sync is disabled. Never enable both owners.

## Rollback

1. If a source schedule has been cut over, restore its Vercel fallback and set
   `SCHEDULE_OWNER=vercel` before stopping the worker schedule.
2. Roll Render back to the last healthy image or suspend the web service.
3. Inspect Key Value delivery state when available; free instances can lose it
   on restart, so never treat it as job history.
4. Leave Supabase `jobs`, action receipts, and lifecycle records intact.
5. Correct or re-enqueue a job with the same canonical identity. Do not delete
   dead-letter evidence to make a retry appear new.

Rollback never drops schema or rewrites completed provider outcomes.

## Known blockers and next work

- Provider credentials remain in the audited legacy tables. Email automation
  stays disabled until the server-only credential boundary is remediated.
- The undispatched web news/action consumer factories were removed. Their
  legacy producers now fail closed instead of claiming that unconsumed work
  was queued. Prompts 006/013 will create canonical jobs and extend this
  registry; the web app remains a producer.
- Actual Render provisioning, two observed heartbeats, readiness proof, and
  the runtime smoke probe still require owner execution in Render.
- Prompt 006 is the next implementation prompt after the worker is provisioned
  and its dark-deployment smoke proof is recorded.

## Production upgrade

Render service types are immutable. Before launch, create a background worker
from the same Docker image, provision persistent `noeviction` Key Value, drain
or safely re-enqueue any pending delivery, validate the canonical probe, and
then retire the free web service. Do not run both consumers during cutover.
