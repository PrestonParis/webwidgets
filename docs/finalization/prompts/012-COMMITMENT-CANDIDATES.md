# 012 — Produce Evidence-Linked Commitment Candidate Actions

Status: Complete
Priority: Critical  
Depends on: 007 and 010; uses canonical records from 004

## Objective

Detect credible commitments, deadlines, and scheduled obligations in
authorized email/calendar signals and create editable candidate actions—not
executions—with evidence, confidence, expiration, and an abstain path.

## Required implementation

- Define or extend typed candidate payloads for task creation and calendar
  preparation using the canonical schema.
- Use the established hybrid pattern: deterministic rules and internal ML for
  cheap classification/extraction, governed LLM resolution only when policy
  permits and ambiguity warrants it.
- Normalize dates, time zones, all-day dates, titles, notes, source reference,
  and suggested due/start/end values.
- Deduplicate candidates across repeated messages, threads, provider retries,
  existing tasks/events, and model reruns.
- Store reason, evidence event IDs, confidence, extractor/model version,
  creation time, expiration, and state.
- Implement candidate states: proposed, edited, approved, dismissed,
  incorrect, expired, and superseded. Approval must bind to the exact edited
  payload version.
- Add authenticated review/edit/dismiss/incorrect APIs and UI in an existing
  appropriate surface.
- Do not execute actions in this prompt.
- Add evaluation fixtures and integration tests for positive, negative,
  ambiguous, duplicate, stale, timezone, malicious, and revoked-consent cases.

## Acceptance criteria

- A credible dated commitment produces one editable task candidate with
  inspectable evidence.
- An irrelevant or ambiguous message produces no candidate or an explicit
  low-confidence review state; it never auto-approves.
- Reprocessing does not create duplicate candidates.
- Editing invalidates prior approval and creates a new exact payload version.
- Dismiss/incorrect feedback is persisted and measurable.
- No source content can approve itself or alter the action policy.

## Completion handoff

Timeline Intelligence now reviews a bounded 14-day window of authorized Gmail
and Outlook timeline events. Deterministic rules produce high-confidence dated
task candidates; only otherwise ambiguous events can reach the governed
`commitment_candidates` Anthropic contract. Missing paid-tier authorization,
revoked consent, abstention, provider failure, malformed dates, stale dates, or
unsupported evidence yields no model candidate. Source text remains untrusted
data and cannot set candidate state.

Candidates persist in the canonical insight/action chain with direct timeline
evidence, reason, confidence, extractor/model version, expiration, normalized
task or calendar payload, stable content-level idempotency, and owner-scoped
RLS. Repeated mail and model reruns converge on one candidate; existing matching
tasks are suppressed. The review UI supports edit, approve, dismiss, and
incorrect. An edit atomically increments the payload version and clears prior
approval. Approval atomically binds the exact current hash and version, but does
not create an action request or execute anything.

Migrations `202608270001_commitment_candidate_reviews.sql` and
`202608270002_enforce_candidate_review_boundary.sql`, followed by
`202608270003_server_own_candidate_proposals.sql`, are deployed to
`webwidgets-dev`, generated types match the live schema, and pgTAP coverage
exercises owner isolation plus stale/exact-version review behavior. Evaluation
fixtures cover positive, irrelevant, ambiguous, duplicate, stale, relative-date,
malicious, unsupported-evidence, and revoked-consent cases. Prompts 013 and 014
are now available; they must consume approved candidates without weakening this
boundary.
