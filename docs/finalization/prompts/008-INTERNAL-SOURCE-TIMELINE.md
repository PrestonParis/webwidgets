# 008 — Normalize Tasks, Notes, Documents, and Activity into the Timeline

Status: Blocked  
Priority: High  
Depends on: 004 and 005

## Objective

Make user-created WebWidgets state part of the same timeline used by external
signals. Capture meaningful task, note/document, and activity changes without
turning every UI interaction into noise.

Pending Prompt 002 approval, domain and knowledge records remain source truth.
Timeline receives meaningful lifecycle facts, while activity and context are
origin-marked, one-way projections that cannot republish themselves into the
timeline.

## Required investigation

- Identify canonical task/todo tables and services, including completion and
  update paths.
- Identify canonical note, journal, uploaded-document, artifact, and parsed
  document records relevant to V1.
- Audit activity-event publishers and consumers to avoid loops where a
  timeline projection republishes itself indefinitely.
- Review existing context producers and decide whether they consume timeline
  events or remain independent projections under the accepted ADR.

## Required implementation

- Define meaningful event types for task create/update/complete/reopen/due,
  note/document create/update/parse-ready, and selected system outcomes.
- Emit canonical events from domain services or an approved outbox/trigger
  boundary so API, automation, and UI writes behave consistently.
- Preserve source record version/reference and prevent duplicate events on
  retries.
- Avoid storing full rich-text or document bodies in timeline records; use
  bounded summaries or references under consent and retention policy.
- Prevent activity/timeline feedback loops and duplicated user notifications.
- Backfill only a bounded, user-triggered or explicitly approved window if
  needed; do not scan all historical private content automatically.
- Add tests for state transitions, duplicate writes, content minimization,
  feedback-loop prevention, deletion behavior, and cross-user access.

## Acceptance criteria

- Task completion and meaningful note/document changes appear once with
  correct timestamps and provenance.
- Routine autosaves or repeated activity projections do not flood the
  timeline.
- Sensitive source bodies are not duplicated into timeline or logs.
- Context/activity integrations remain coherent and documented.
- Prompt 009 can query a unified event model without feature-specific joins.
