# V1 Worker Deployment and Operations

Status: Production path implemented; Render provisioning pending

Implemented: 2026-08-15

Decision basis: ADR-008, ADR-010, ADR-011, ADR-013, and ADR-014

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

## Supported production topology

Render is the selected V1 container host. The repository-root `render.yaml`
defines one Docker background worker and one private, persistent Render Key
Value instance with `noeviction`. Render documents BullMQ as a supported Node
background-worker framework and supports Docker workers, private Key Value
connection strings, and bounded SIGTERM shutdown delays:

- [Render background workers](https://render.com/docs/background-workers)
- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
- [Render Docker deployments](https://render.com/docs/docker)

The Blueprint uses paid `starter` resources because Render does not offer its
free plan for background workers. Provisioning it is an external account and
billing action; repository completion does not imply that the service is
already running.

## Queue and execution contract

| Queue          | Initial concurrency | Prompt 005 processor                                                     |
| -------------- | ------------------: | ------------------------------------------------------------------------ |
| `v1-ingestion` |                   4 | Versioned runtime probe; source processors arrive in Prompts 006-008     |
| `v1-analysis`  |                   4 | Versioned runtime probe; governed inference arrives in Prompt 010        |
| `v1-schedule`  |                   1 | Versioned runtime probe; durable schedules extend this registry          |
| `v1-action`    |                   2 | Versioned runtime probe; real governed actions arrive in Prompts 013-014 |

The probe is a real persisted smoke operation with no provider side effect. An
unsupported task fails explicitly; it is never reported as successful.
Processors have a two-minute default timeout, three exponential-backoff
attempts, 30-day successful diagnostics, and 90-day failed/dead-letter
diagnostics. The canonical row's `max_attempts` remains authoritative.

## Environment contract

| Variable                    | Required    | Purpose                                                         |
| --------------------------- | ----------- | --------------------------------------------------------------- |
| `SUPABASE_URL`              | yes         | Confirmed WebWidgets Supabase project URL                       |
| `SUPABASE_SERVICE_ROLE_KEY` | yes, secret | Server-only worker credential; never expose to web code or logs |
| `REDIS_URL`                 | yes, secret | Render Key Value private connection string                      |
| `V1_QUEUES_ENABLED`         | no          | Starts the four V1 consumers; defaults to `true`                |
| `WORKER_DRY_RUN`            | no          | Defaults to `true` for dark deployment                          |
| `EMAIL_SYNC_ENABLED`        | no          | Defaults to `false`; requires all provider client credentials   |
| `SCHEDULE_OWNER`            | no          | `vercel` or `worker`; defaults to `vercel` during dark launch   |
| `HEALTH_PORT`               | no          | Internal liveness/readiness port; defaults to `10000`           |
| `HEARTBEAT_INTERVAL_MS`     | no          | Redis/Supabase dependency heartbeat interval                    |
| `JOB_TIMEOUT_MS`            | no          | Bounded processor execution time                                |
| `SHUTDOWN_TIMEOUT_MS`       | no          | Must remain below Render's shutdown delay                       |
| `SYNC_BATCH_SIZE`           | no          | Bounded existing email snapshot batch size                      |
| `SYNC_INTERVAL_MINUTES`     | no          | Email schedule interval after worker cutover                    |

Provider client IDs/secrets and tenant configuration are required only when
email sync is enabled. The committed `.env.example` contains placeholders,
never values.

## Readiness, heartbeat, and logs

`GET /live` returns success until shutdown begins. `GET /ready` returns 200
only when Redis responds to `PING` and the canonical `jobs` table is reachable
through the worker client; it returns 503 otherwise. The Docker image carries
the same readiness probe as a container health check.

Render background workers do not expose a public URL. The runtime therefore
also performs the readiness check every 30 seconds and emits a structured
heartbeat containing only instance/dependency status. Job logs include job,
user, correlation, queue, safe failure code, and attempt identifiers; they do
not include tokens, emails, source bodies, payloads, or raw provider errors.

## Dark deployment procedure

1. Review and merge the Prompt 005 branch through CI.
2. In Render, create a Blueprint from the repository's `render.yaml`.
3. Supply `SUPABASE_URL` for `webwidgets-dev` and its service-role credential
   through Render's secret prompt. Do not use the Worldview project.
4. Keep `WORKER_DRY_RUN=true`, `EMAIL_SYNC_ENABLED=false`, and
   `SCHEDULE_OWNER=vercel` for the first deployment.
5. Confirm the startup log reports four V1 workers, dry-run mode, and ready
   Redis/Supabase dependencies. Confirm at least two successful heartbeats.
6. Set temporary `SMOKE_USER_ID` and `SMOKE_IDEMPOTENCY_KEY` values in a Render
   shell and run `node dist/smoke.js`. The command must observe one canonical
   job reaching `completed`.
7. Re-run with the same idempotency key. It must return the existing canonical
   completion rather than produce a second product result.

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
2. Roll Render back to the last healthy image or scale the worker to zero.
3. Preserve Redis while inspecting delivery state; do not treat it as the job
   history.
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
- Actual Render provisioning, two observed heartbeats, and the remote smoke
  probe require owner approval for the paid Render resources.
- Prompt 006 is the next implementation prompt after the worker is provisioned
  and its dark-deployment smoke proof is recorded.
