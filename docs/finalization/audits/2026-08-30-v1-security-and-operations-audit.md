# V1 Security and Operations Audit — 2026-08-30

## Result

The V1 loop is suitable for a limited staging pilot after migrations
`202608300003` through `202608300005` and the matching worker/web release are live.
No known critical or high-severity V1 issue remains open. The review closed
six launch-significant findings and retained two medium follow-ups that do not
permit cross-user access or unapproved side effects.

## Scope and method

The review followed data from integration connection through raw observation,
timeline event, inference, briefing/candidate, approval, job, provider action,
and verified outcome. It inspected the V1 API routes, Render sync worker,
inference sidecar, n8n callbacks, Gmail Pub/Sub callback, conversion API,
tracked migrations, RLS policies, and command-center degraded states.

The following boundaries were exercised by existing and new automated tests:

| Boundary           | Control and evidence                                                                                                                                                                                      |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User data          | Owner-column RLS plus composite owner foreign keys; pgTAP suites 004–018 exercise cross-user rejection and browser credential denial.                                                                    |
| Worker privilege   | Service-role key exists only in server/worker processes. Every V1 worker lookup includes `user_id`; provider claims re-check connection state.                                                            |
| External inference | Paid tier plus current consent scopes are checked per request. Source text is bounded and explicitly treated as untrusted data; output is schema-validated and cannot execute tools.                      |
| Approval/execution | Exact payload hash/version is approved. Pause, expiry, disconnect, and provider credential state are checked again before dispatch. Provider receipts and unique keys prevent replayed side effects.      |
| Webhooks           | n8n and Gmail secrets fail closed and use constant-time comparison. n8n callbacks validate typed identity fields and persist idempotently. Gmail history and queue uniqueness suppress repeated delivery. |
| Feed ingestion     | HTTP(S)-only, no credentials or unusual ports, DNS/IP private-range rejection on every redirect, 20-second timeout, five redirects, and 2 MB maximum.                                                     |
| Files              | Executable/double-extension/MIME/size checks remain active. HTML as an input conversion is disabled until active sanitization exists.                                                                     |
| Operations         | Heartbeats and snapshots contain identifiers, states, counts, hashes, and safe failure codes—not source bodies, prompts, tokens, or provider responses.                                                   |

## Findings

| ID        | Severity | Finding                                                                                                                       | Resolution                                                                                                                                                                                                  |
| --------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V1-SEC-01 | High     | `/api/metrics` was public whenever `METRICS_SECRET` was omitted.                                                              | Closed. The endpoint now fails closed, compares the bearer token in constant time, and returns 503 when monitoring is unconfigured.                                                                         |
| V1-SEC-02 | High     | The conversion catalog exposed HTML-input routes while documenting that HTML was not actively sanitized.                      | Closed. HTML input is removed from both catalogs and rejected again at the API policy boundary. HTML output remains available.                                                                              |
| V1-OPS-01 | High     | Worker readiness existed only in transient Render logs, allowing silent background failure.                                   | Closed. Dependency state is persisted every heartbeat, expires after 90 seconds, feeds metrics/admin snapshot, and drives a command-center degraded banner.                                                 |
| V1-SEC-03 | High     | Profile, integration, and legacy model-key values were readable/writable from authenticated browser clients.                  | Closed. Browsers receive presence metadata only; authenticated server routes own all secret reads/writes. pgTAP 017–018 prove the boundary.                                                                |
| V1-SEC-04 | High     | The dormant conversion workspace resolved six high-severity dependency advisories, including vulnerable image parsing.       | Closed. Sharp and transitive packages were upgraded; `npm audit` reports zero vulnerabilities. The service remains outside V1 deployment.                                                                  |
| V1-SEC-05 | Medium   | n8n and Gmail shared-secret checks used ordinary string comparison.                                                           | Closed. Both use length-gated constant-time comparison and fail closed without configuration.                                                                                                               |
| V1-SEC-06 | Medium   | Gmail Pub/Sub authentication still supports a query-string shared token, which can appear in infrastructure request metadata. | Accepted for staging. The value is never logged by application code; rotate it after any suspected exposure. Replace with verified Google OIDC push identity before a broad public launch.                  |
| V1-OPS-02 | Medium   | The staging stack has no external Prometheus/Alertmanager deployment.                                                         | Accepted for staging. The protected scrape endpoint, alert rules, admin JSON snapshot, SQL query, and user-visible state are implemented. Connect an alert receiver before inviting users beyond the pilot. |

## Threat conclusions

- Prompt injection cannot directly become an action. External content is data
  inside a bounded prompt; model output must match strict schemas and becomes a
  candidate only. A human approves the exact version/hash, and the worker
  re-checks pause, expiry, ownership, consent/connection state, and payload hash.
- SSRF defenses cover the V1 RSS path, including redirects and DNS resolution.
  Provider URLs are fixed by code. User-configurable n8n base URL is a deployment
  secret, not request input.
- Unknown or timed-out provider outcomes are persisted as `unknown`, never as
  success. Replays return existing receipts or are blocked by unique provider
  execution/idempotency constraints.
- Source disconnect stops scheduling and blocks later provider writes. Consent
  revocation prevents later external inference. User-owned context, timeline,
  consent, connection, action, and briefing rows remain viewable/deletable under
  RLS; export jobs remain owner-scoped.
- Resource limits are enforced at the feed, inference, candidate, scheduler,
  queue, action, and automation layers. The pilot cost ceiling is operationally
  measured from `cost_events`; it is an alert/stop control rather than billing
  authorization.

## Failure exercises

| Scenario                                                  | Evidence                                              | Expected state                                       |
| --------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------- |
| Worker restart/stale heartbeat                            | pgTAP 016 and persisted 90-second lease               | Degraded; no false completion                        |
| Redis or Supabase outage                                  | readiness unit tests plus heartbeat dependency fields | `/ready` 503; heartbeat degraded/stale               |
| Model outage/rate limit/malformed output/prompt injection | governed inference Python tests                       | Typed failure/abstention; no candidate execution     |
| Provider rate limit/revoked token                         | worker provider-ingestion tests                       | Degraded source with safe code; no fabricated events |
| Pause after approval                                      | pgTAP 013 and worker dispatcher tests                 | Execution cancelled before provider dispatch         |
| Repeated webhook/worker retry                             | n8n callback, action, automation, and lifecycle tests | One durable receipt/side effect                      |
| Unsafe RSS redirect/private IP/oversize feed              | RSS ingestion tests                                   | Non-retryable safe failure                           |
| Unsanitized HTML input                                    | conversion policy/matrix tests                        | HTTP 400 / route absent                              |

## Deferred work

The two medium findings above are release-plan work, not hidden blockers. A
production launch should also add centralized retention for Vercel/Render logs,
automated restore drills, per-account cost budgets, and Google OIDC verification
for Pub/Sub. None changes the staging-pilot security decision.
