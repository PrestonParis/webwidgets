# V1 Operations Runbook

## Operator surfaces

- Render: `webwidgets-v1-worker`; `/live` proves the process is accepting
  traffic and `/ready` checks Redis plus Supabase.
- Vercel: `webwidgets.me`; `/api/healthz` is process liveness and `/api/ready`
  validates web configuration.
- Admin JSON: signed-in admins can GET `/api/operations/v1`.
- Prometheus: GET `/api/metrics` with `Authorization: Bearer $METRICS_SECRET`.
- SQL: service-role operators can run
  `select public.get_v1_operations_snapshot();` in Supabase.

Never paste source bodies, email snippets, OAuth tokens, prompts, approved
payloads, or provider responses into alerts or tickets. Correlate with
`connection id → job id/correlation id → candidate/run → action request →
action result` and safe failure codes.

## Required environment

Web/Vercel requires the Supabase URL, anon key, service-role key,
`WORKER_SERVICE_URL`, `WORKER_API_TOKEN`, and `METRICS_SECRET`. Provider and model
features additionally require their documented OAuth/client, inference, and
n8n values. Worker/Render requires `SUPABASE_URL`,
`SUPABASE_SERVICE_ROLE_KEY`, `REDIS_URL`, `WEB_APP_URL`, `WORKER_API_TOKEN`,
and the enable/dry-run flags in `V1_WORKER_DEPLOYMENT.md`. Secrets must be
different by environment and rotated after suspected disclosure.

## Deploy and migration

1. Confirm the linked project with `npx supabase migration list --linked`.
2. Apply migrations with `npx supabase db push --linked` before deploying code
   that writes new tables.
3. Push the reviewed `finalization` commit. Wait for Vercel and Render to be
   Ready.
4. Confirm `/ready`, then wait up to 90 seconds for `worker.healthy=true` in
   the admin snapshot.
5. Scrape metrics and run the Prompt 18 pgTAP suite. Do not enable provider
   actions if heartbeat, dead-letter, duplicate, or action-unknown alerts fire.

Rollback application code first. The heartbeat table/function are additive and
safe to leave in place. Do not drop a migration from production history. If a
release has already dispatched actions, preserve its receipts and investigate
by correlation ID before retrying.

## Alert thresholds

The tracked rules are in `operations/v1-alert-rules.yml`.

| Signal              | Warning                                        | Page/stop condition                                |
| ------------------- | ---------------------------------------------- | -------------------------------------------------- |
| Worker heartbeat    | unhealthy for 2 minutes                        | unhealthy for 5 minutes                            |
| Queue               | depth > 100 for 10 minutes                     | oldest age > 5 minutes                             |
| Dead letters        | any in 24 hours                                | any action dead letter                             |
| Sources             | overdue/degraded present                       | provider-wide or >25% active sources               |
| Timeline duplicates | —                                              | any persisted duplicate group                      |
| Inference           | 5 failures/24h or cost > $5/24h                | sustained failures; pause external inference       |
| Briefings           | average >20 seconds or negative feedback rises | repeated failures with stale user output           |
| Candidates          | dismissals >20/24h                             | investigate quality before expanding automation    |
| Actions             | any unknown outcome                            | any duplicate provider receipt or repeated unknown |
| Automations         | any failure/dead letter                        | pause-all does not stop a queued execution         |

## Triage and recovery

1. Record the snapshot and deployment release IDs. Determine whether web,
   worker, Redis, Supabase, inference, or one provider is impaired.
2. If writes may duplicate, pause all automations before intervention. Never
   convert `unknown` to success manually.
3. Redis outage: keep the worker stopped until Redis is healthy. Canonical jobs
   remain in Supabase; schedulers will enqueue due source work after restart.
4. Supabase outage: do not drain Redis. Restore connectivity, restart the
   worker, and verify canonical job state before retrying.
5. Provider 429/5xx: leave the source degraded and allow bounded backoff. A
   revoked token requires user reconnection; never re-enable it in SQL.
6. Model outage/cost alert: disable external inference configuration. Rules and
   existing data continue; candidates are not fabricated.
7. Dead letter: inspect only job type, safe failure code, attempt count,
   correlation ID, and linked receipt. Fix the dependency. Re-trigger source
   sync through the connection UI or retry the exact action through its product
   control so idempotency is preserved—never insert a second action manually.
8. Repeated webhook: rotate the secret if authenticity is uncertain. Existing
   callback/queue idempotency should return a replay result without a second
   side effect.

## Backup and disaster recovery

Before schema releases, take a Supabase logical dump or verify the project’s
managed backup status. Restore drills must validate owner RLS, integration
connection state, canonical jobs, action requests/results, and automation pause
controls. Redis is disposable delivery state; Supabase receipts are canonical.
After restore, start the worker in dry-run mode, inspect the snapshot, then
enable provider actions only after queued/unknown actions are reconciled.

## On-call closeout

An incident closes only when the heartbeat is fresh, queue age is falling,
dead letters and unknown outcomes are understood, sources have current status,
and no manual recovery created a duplicate receipt. Add the safe IDs, release,
failure code, time window, and corrective action to the incident record.
