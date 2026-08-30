# WebWidgets V1 Release Notes (Candidate)

## What V1 supports

WebWidgets V1 collects user-authorized Gmail, Google Calendar, Outlook Mail,
RSS/Atom, task, journal, document, artifact, and selected automation signals
into an owner-scoped timeline. It shows provenance and source health, creates
cited briefings, proposes editable commitment tasks/calendar events, and
executes exact-approved actions through durable jobs and verified receipts.

Gmail is the primary email provider; Outlook Mail is secondary. Both can
prepare drafts and send only after a separate approval of the exact account,
recipients, subject, body, and reply context. Editing invalidates approval.
Google Calendar event creation/cancellation, local task create/update/complete,
and allowlisted workflows use the same approval and receipt boundary.

Four bounded automation templates are available: daily briefing, commitment
capture, calendar preparation, and stale-task review. They support dry-run,
enable/disable, global pause, rate/cost limits, and visible run history.

## Autonomy limits

WebWidgets may collect, rank, summarize, abstain, and prepare drafts. V1 does
not autonomously send email, delete data, purchase, publish, change
permissions, or execute unapproved external writes. External content is
untrusted evidence and cannot approve an action or change policy.

## Beta and deferred surfaces

Chess, Creative/Art Studio, Memorization, and Reading remain visible Beta
features for existing users but are excluded from default onboarding and V1
completion claims. Outlook Calendar, generalized MCP infrastructure, the Go
worker, broad autonomous agents, and production hosting for the conversion
service are deferred.

## Known release blockers

- The seven-day staging pilot has not yet produced seven qualifying days.
- GitHub required checks cannot be enabled for this private repository on the
  current account plan; GitHub returned HTTP 403. Upgrade the plan or make the
  repository public before release.
- Free Render web/Key Value resources are finalization infrastructure. Cut
  over to continuous worker compute and persistent queue storage before public
  V1 release.
- Connect an external alert receiver before expanding beyond the pilot.
- Human release-owner approval is still required.

## Recovery and support

Operators follow [V1_OPERATIONS_RUNBOOK.md](V1_OPERATIONS_RUNBOOK.md) for
health checks, pause controls, retry/dead-letter handling, incidents, and
secret-safe evidence. Deployment and rollback are in
[V1_RELEASE_CHECKLIST.md](V1_RELEASE_CHECKLIST.md). Failed or unknown actions
remain visible and are reconciled from canonical receipts; they are never
reported as successful from a provider submission alone.
