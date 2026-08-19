# 007 — Normalize Email and Calendar Signals into the Timeline

Status: Cutover pending
Priority: Critical  
Depends on: 004 and 005

## Objective

Project existing Gmail/Outlook and calendar sync data into canonical timeline
events without creating another provider sync system. Preserve provider
identity, authorization boundaries, cursor state, and source deletion rules.

Pending Prompt 002 approval, converge the webhook, polling, Vercel-cron, and
sync-worker paths instead of preserving multiple schedule owners. Next.js
validates provider webhooks; the V1 worker owns scheduled sync, normalization,
retry, and source health. Cut over account by account before retiring a legacy
processor.

## Required investigation

- Trace Gmail and Outlook webhook/cron/sync-worker flows, token refresh,
  snapshot storage, email classification, action extraction, and calendar
  reads.
- Determine which existing provider records are canonical and which are
  caches or snapshots under the accepted ownership ADR.
- Verify OAuth scopes and whether Outlook Calendar is sufficiently implemented
  for V1; document and defer it if not.

## Required implementation

- Emit idempotent timeline events for relevant message arrival/update and
  calendar create/update/cancel changes.
- Minimize stored message content. Store provider references and only the
  normalized fields required for V1 display and analysis under the retention
  policy.
- Preserve provider occurrence time, conversation/thread/event ID, account,
  source type, sync time, and deletion/cancellation state.
- Ensure reconnect, cursor replay, webhook retry, and polling overlap do not
  duplicate events.
- Stop future processing promptly when a user disconnects or revokes consent.
- Make provider sync health and last-success status available to Prompt 009.
- Add integration tests for two users, multiple accounts, duplicate webhook,
  cursor replay, token expiration, disconnect, event cancellation, and all-day
  calendar dates.
- Keep existing inbox actions working; do not silently change confidence
  policy in this prompt.

## Non-goals

- Do not generate briefings or candidate actions.
- Do not request broader OAuth scopes than V1 needs.
- Do not copy full inboxes into a new table without a documented necessity and
  retention decision.

## Acceptance criteria

- New email and calendar changes appear once in the correct user’s timeline.
- Provider references allow authorized drill-down without exposing another
  user or account.
- Disconnect prevents subsequent ingestion.
- Failures are visible through source health and do not fabricate empty
  success.
- Existing email/calendar critical behavior remains covered by regression
  tests.

## Implementation notes

- `integration_connections` now owns Google/Microsoft source identity, cursor,
  schedule, health, and disconnect state. `user_email_accounts` retains tokens
  and links to the connection through an owner-matched foreign key.
- The V1 worker normalizes Gmail History, Google Calendar incremental sync, and
  Outlook Mail delta results into minimized raw observations and canonical
  timeline events. Gmail and Calendar consume every response page before
  advancing their provider cursor.
- Identity includes user, connection, provider object, change, and provider
  version. Webhook retries, polling overlap, and cursor replay coalesce while
  meaningful provider versions remain separate facts.
- Gmail metadata continues to project into `email_snapshots` and the existing
  `email_queue`, preserving the current classification/action path during
  cutover. The Gmail webhook also schedules its canonical connection due.
- The authenticated disconnect RPC atomically marks the source disconnected,
  clears future scheduling, and removes the linked credential row. The worker
  rechecks connection state between signals and does not advance the cursor
  when disconnection interrupts a run.
- Outlook Calendar is deferred. The live Microsoft flow grants `Mail.Read`,
  not a calendar scope, and this prompt does not expand consent silently.

## Verification completed

- Migration `202608180002_email_calendar_connections.sql` was applied to
  `webwidgets-dev`; linked types were regenerated from the live schema.
- All 31 pgTAP assertions pass, including cross-user connection isolation and
  owner-only atomic disconnect; Supabase database lint reports no errors.
- The sync worker passes typecheck, formatting, and 24 tests covering two
  users, multiple accounts, duplicate delivery, meaningful versions,
  disconnect, token expiration, revocation, pagination, cancellation, and
  all-day dates.
- The web app passes TypeScript validation and the 14 focused inbox/RSS
  regression tests. The Sync Worker CI job passed on commit `6be0e617`.

## Remaining live acceptance proof

Render must receive the four Google/Microsoft OAuth client variables introduced
in `render.yaml`. After the new deployment is healthy, enable
`PROVIDER_SYNC_ENABLED=true`, run one connected account through a canonical
sync, verify timeline/source-health records, then disconnect that fixture and
confirm no later job advances its cursor. Keep the flag false until that proof
is complete.
