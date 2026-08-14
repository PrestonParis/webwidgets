# 012 — Produce Evidence-Linked Commitment Candidate Actions

Status: Blocked  
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
