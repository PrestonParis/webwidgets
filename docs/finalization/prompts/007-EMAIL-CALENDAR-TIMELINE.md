# 007 — Normalize Email and Calendar Signals into the Timeline

Status: Blocked  
Priority: Critical  
Depends on: 004 and 005

## Objective

Project existing Gmail/Outlook and calendar sync data into canonical timeline
events without creating another provider sync system. Preserve provider
identity, authorization boundaries, cursor state, and source deletion rules.

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
