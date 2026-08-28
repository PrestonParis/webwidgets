# 014 — Execute Calendar, Email, and Workflow Actions

Status: Blocked  
Priority: Critical  
Depends on: 005, 012, and email credential/OAuth hardening below; coordinate shared action contracts with 013

2026-08-28 update: owner approved the security prerequisite. Implementation and
rollback-only database tests are prepared; coordinated deployment and live
reconnect verification remain outstanding. See
[`EMAIL_CREDENTIAL_CUTOVER.md`](../EMAIL_CREDENTIAL_CUTOVER.md). No new send
capability is enabled, and this prompt is not complete.

Continuation check: signed-in Render and Vercel access is now available.
Production still runs `main`, the `finalization` preview has a different
Supabase project URL, and the latest worker deployment fails because
`WEB_APP_URL` and `WORKER_API_TOKEN` are missing. The cutover document records
the deployment evidence and required target decision. Migrations
`202608280001`/`202608280002` remain unapplied.
The legacy email-draft, calendar-create, and workflow handlers now fail
explicitly instead of reporting fabricated provider success (10 action-engine
and registry tests pass). This is a safety correction, not implementation of
the remaining provider executors. Coordinated deployment and real reconnect
verification are still needed to pass the security prerequisite.

## Objective

Replace the remaining V1 provider placeholders with real, verified calendar
event creation, email-draft preparation, explicitly approved email sending,
and explicitly configured workflow triggering. Gmail is the primary email
provider; Outlook is secondary and supports both drafts and approved sending.

The owner approved this scope expansion on 2026-08-28 (FIN-019). It replaces
the original drafts-only requirement, not the prohibition on autonomous send.

Under the accepted Prompt 002 ownership decision, n8n is an optional executor adapter. Its
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

### Email draft and explicit send

- Reuse the authorized Gmail/Outlook boundary if present; otherwise add
  the smallest provider adapter required by V1.
- Create a draft in the correct account and thread without sending it.
- Prevent recipients, thread, or body from changing after approval without a
  new payload version and approval.
- Verify the draft exists and record only safe receipt metadata.
- Implement sending as a distinct action with separate exact-message approval.
  Bind provider/account, To/Cc/Bcc, subject, body, and reply/thread context;
  include attachments in approval if attachment support is later added.
  Editing any field invalidates approval. Draft approval is never send approval.
- Require an explicit user action for each send; no model, n8n workflow, or
  autonomous template can approve or dispatch an unapproved message.
- Request additional OAuth scopes only through an explicit capability upgrade
  and provider re-consent. Persist actual granted scopes, never assumed ones.
- Prefer Gmail in the UI without silently switching the approved account or
  falling back to Outlook when Gmail fails. Outlook uses the same approval
  and verification rules, with separate Mail.Send authorization.
- After an ambiguous network result, reconcile with provider state; never
  blindly resend. Report sent/submitted versus recipient delivery honestly.
- Sending has no promised undo. Any live send test needs an explicitly
  approved recipient and exact message; implementation approval is not that
  authorization.

### Security prerequisite and maintenance approval

Prompt 014 is blocked before expanding OAuth scopes. The 2026-08-13 live
audit found owner-browser-readable raw credentials in `user_tokens` and
`user_email_accounts`; tracked migrations still retain those access paths.
Local and linked migration histories match through `202608270005` as checked
on 2026-08-28. This check does not rule out untracked live grant changes.

The account-connect audit also found that the Google inbox callback trusts a
query-string owner ID, and Microsoft state is a redirect rather than a
user-bound anti-CSRF nonce. These paths need remediation before handling
sending-capable credentials.

Execute a separately reviewed prerequisite first:

1. Verify live grants without selecting credentials; inventory all affected
   browser, server, and worker consumers.
2. Prepare the human-approved maintenance/rollback plan required by schema
   remediation task 2. Isolate email credentials behind one server-only store
   and expose only non-secret account/connection metadata to browser clients.
   Preserve account identity, ownership, refresh, disconnect, and ingestion.
3. Bind OAuth callbacks to the initiating authenticated user, unpredictable
   state/PKCE, short expiry, and a safe local redirect. Reject replay, owner
   mismatch, missing grants, and failed scope/account verification.
4. Test two-user credential isolation, connect/reconnect, token refresh,
   revoked consent, callback replay, and existing read-only ingestion.
5. Only after this gate passes, implement Gmail-first drafts and sending,
   Outlook parity, calendar execution, and canonical workflow execution.

Do not rotate/delete credentials or migrate remote credential data without
the separate maintenance approval. Other credential findings in the audit
remain tracked security work; this prerequisite must not claim to fix them.

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
- A draft action cannot send; a separate send action requires the user's exact
  message approval and the selected account's granted write/send permission.
- Gmail supports the primary draft/send journey and Outlook supports the same
  bounded secondary journey. Autonomous sending remains unavailable.
- Workflow execution cannot bypass the unified approval and audit lifecycle.
- Unconfigured providers fail explicitly and never report acceptance.
