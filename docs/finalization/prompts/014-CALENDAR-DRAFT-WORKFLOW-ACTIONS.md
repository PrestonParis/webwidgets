# 014 — Execute Calendar, Email-Draft, and Workflow Actions

Status: Blocked  
Priority: Critical  
Depends on: 005 and 012; coordinate shared action contracts with 013

## Objective

Replace the remaining V1 provider placeholders with real, verified calendar
event creation, email-draft preparation, and explicitly configured workflow
triggering. Email sending is not permitted.

Pending Prompt 002 approval, n8n remains an optional executor adapter. Its
dispatches and callbacks must correlate idempotently to canonical
action/job records; n8n is not the schedule, approval, or run-history owner.

## Required implementation

### Calendar

- Reuse the existing Google Calendar connector/service and preserve all-day
  handling from ADR-003.
- Validate title, date/time, timezone, duration, attendees, account, and
  provider permission immediately before execution.
- Use an idempotency strategy that prevents duplicate events across retries.
- Read the created event back and record provider ID, canonical dates, link,
  and verified outcome.
- Implement cancellation/undo where the connector and approval policy allow.

### Email draft

- Reuse the authorized Gmail/Outlook draft boundary if present; otherwise add
  the smallest provider adapter required by V1.
- Create a draft in the correct account and thread without sending it.
- Prevent recipients, thread, or body from changing after approval without a
  new payload version and approval.
- Verify the draft exists and record only safe receipt metadata.
- Ensure no action definition, UI control, or automation can send the message.

### Workflow

- Reuse the validated n8n workflow service and allowed workflow-key schemas.
- Require an explicitly configured workflow and validated typed parameters.
- Persist dispatch ID, callback/result, failure, timeout, and idempotency.
- Treat n8n as an executor adapter, not the canonical approval/run database.

### Shared requirements

- Remove provider-placeholder success for these action IDs.
- Enforce permissions, consent, exact-payload approval, rate limits, queue
  processing, verification, lifecycle persistence, and honest errors.
- Add integration tests for success, retry, duplicate, revoked permission,
  wrong account, timezone/all-day, draft-not-send, invalid workflow, callback
  replay, and verification failure.

## Acceptance criteria

- Each V1 action performs real work and returns a verified receipt.
- Duplicate delivery creates no duplicate external side effect.
- An email action can create a draft but cannot send.
- Workflow execution cannot bypass the unified approval and audit lifecycle.
- Unconfigured providers fail explicitly and never report acceptance.
