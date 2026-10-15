# WebWidgets V1 Acceptance Criteria

V1 is ready only when all required criteria below have evidence from staging
or production-like tests. “Code exists” is not evidence of working behavior.

## Product journeys

- A new user can connect at least one supported personal source and add one
  RSS/Atom source.
- New source items appear on a user-scoped timeline with provenance.
- The user can generate or receive a briefing based on real timeline data.
- A credible commitment can become an editable candidate task.
- Approval creates exactly one real task.
- The task can be updated and completed, and its outcome is visible.
- An approved calendar candidate creates exactly one provider event.
- An email response can be prepared as a draft but is not sent automatically.
- Gmail is the primary email provider; Outlook is secondary. Both support
  sending only after a separate user approval of the exact account, recipients,
  subject, body, and reply context. Editing invalidates send approval.
- At least the daily briefing and commitment-capture automations run through
  the durable automation state machine.
- The user can inspect, pause, disable, and review automation runs.

## Timeline quality

- Events preserve source, source URL/reference, provider timestamp, fetch
  timestamp, user ownership, and normalization version.
- Reprocessing the same source event does not create a duplicate timeline
  event or duplicate action.
- Related feed items are clustered or visibly identified as duplicates.
- Source failures and stale syncs are visible.
- Disconnecting a source stops future ingestion.
- Timeline and derived records obey documented retention and deletion rules.

## Intelligence quality

- Briefings cite or link to supporting timeline events.
- Candidate actions include evidence, reason, confidence, and editable input.
- The system can abstain when evidence or confidence is insufficient.
- External content cannot approve an action or modify system policy.
- Evaluation fixtures cover relevant, irrelevant, ambiguous, duplicate, stale,
  and malicious-content cases.
- Launch thresholds for precision, duplicate rate, latency, and cost are
  documented and met; thresholds must be set before the final staging pilot.

## Action and automation safety

- No placeholder handler reports successful execution.
- State-changing actions require approval of the exact payload unless the user
  enabled a specifically permitted low-risk automation.
- Idempotency prevents duplicate provider-side effects.
- Provider results are verified after execution.
- Failed and partially completed actions are visible and recoverable.
- Revoked consent or permission blocks later execution.
- Every automation supports enable, disable, dry-run, and visible run history.
- A global per-user pause stops new automated executions.
- Email sending, deletion, purchasing, publishing, and permission changes are
  unavailable for autonomous execution in V1.

## Security and data

- The live V1 schema has a repository-tracked baseline and migrations.
- RLS tests demonstrate isolation for every V1 user-owned table.
- Service-role access remains confined to authenticated server/worker paths
  with explicit user scoping.
- OAuth tokens and secrets are neither exposed client-side nor written to
  logs, prompts, audit payloads, or error messages.
- External-model requests minimize sensitive content and honor consent.
- Users can view and delete stored context used for personalization.
- Inputs from feeds, email, and documents are treated as untrusted.
- Rate, concurrency, and cost limits exist for ingestion, inference, and
  actions.

## Reliability and operations

- Production has a documented owner and deployment path for every required
  process.
- Worker heartbeat, queue depth, source sync lag, dead letters, action failure,
  and inference failure are monitored.
- Jobs survive worker restarts and are safe to retry.
- Staging completes seven consecutive days of scheduled ingestion and
  automation without silent data loss or duplicate side effects.
- Backup, recovery, schema migration, and provider-outage behavior are
  documented and exercised proportionally to V1 risk.

## Experience

- The primary signed-in surface clearly shows changes, priorities, pending
  approvals, completed actions, and failures.
- Loading, empty, stale, disconnected, permission-denied, and error states are
  understandable.
- Critical journeys work with keyboard navigation and screen readers and at
  supported mobile/desktop web widths.
- Chess, Creative, Memorization, and Reading are visibly Beta and excluded
  from default onboarding and V1 completion claims.
- No unimplemented control is presented as functional in a V1 journey.

## Engineering release gate

- Targeted lint and type checks pass for all finalization work.
- Unit tests cover new business logic.
- Integration tests cover source adapters, RLS-sensitive queries, inference
  boundaries, action providers, and automation transitions.
- E2E tests cover timeline/briefing, commitment-to-task, and basic automation.
- CI checks are required on the release branch.
- Critical and high-severity security findings are closed.
- Remaining known limitations are documented in the release notes and do not
  contradict the V1 product definition.
