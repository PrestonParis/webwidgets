# 018 — Complete V1 Security and Operational Hardening

Status: Blocked  
Priority: Critical  
Depends on: 005 through 017

## Objective

Harden the complete V1 loop against cross-user access, unsafe external
content, permission drift, duplicate side effects, resource exhaustion, and
silent background failure. Provide operations evidence sufficient for a
staging pilot.

## Required security review

- Audit RLS and user scoping for every route, worker query, and V1 table.
- Audit service-role use, OAuth scopes, token refresh/storage/revocation,
  secret logging, webhook authentication, and n8n callbacks.
- Threat-model feed, email, and document prompt injection; SSRF; unsafe HTML;
  malicious links/files; model output; replay; forged approval; and confused
  deputy behavior across accounts.
- Verify consent is checked at ingestion, inference, and execution—not only
  at configuration time.
- Add rate, concurrency, payload, and cost limits for source fetch, inference,
  candidate generation, action execution, and automation.
- Verify context view/delete/export and source disconnect/deletion behavior.
- Fix the known conversion HTML sanitization gap if the unsafe conversion path
  is V1-reachable; otherwise disable that path and document the deferral.

## Required operational implementation

- Add metrics and alerts for worker heartbeat, queue depth/age, dead letters,
  source sync lag/failure, timeline duplicate rate, inference failure/cost,
  briefing latency/usefulness, candidate dismissal, action success/duplicate,
  and automation failure/pause.
- Add safe structured correlation across source, job, inference, candidate,
  run, action, and outcome without logging private content.
- Add readiness checks for required dependencies and a user-visible degraded
  mode where appropriate.
- Document deployment, environment variables, migrations, rollback,
  provider-outage behavior, backup/recovery, dead-letter recovery, and on-call
  triage for V1 processes.
- Exercise worker restart, Redis outage, model outage, Supabase interruption,
  provider rate limit, revoked token, and repeated webhook scenarios.

## Deliverables

- A dated security/operations audit under `docs/finalization/audits/`.
- Fixed critical/high findings or explicit V1 blockers.
- Monitoring dashboards/queries/configuration and an operator runbook.
- Tests that reproduce and prevent discovered critical failures.

## Acceptance criteria

- No known critical/high cross-user, secret, prompt-injection-to-action,
  duplicate-side-effect, or unsanitized V1 path remains open.
- A worker or provider outage is detected and visible without false success.
- Pause and revocation prevent later state-changing execution.
- Operators can trace and recover a failed run without reading private source
  bodies.
- Release thresholds can be measured from actual telemetry.
