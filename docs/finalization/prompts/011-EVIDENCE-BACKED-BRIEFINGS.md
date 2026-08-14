# 011 — Generate Evidence-Backed Daily and On-Demand Briefings

Status: Blocked  
Priority: Critical  
Depends on: 009 and 010

## Objective

Generate a concise briefing from real timeline data that answers what changed,
what matters, what is due, and what needs review. Every claim must link to
supporting timeline events, and the system must degrade honestly when sources
or inference are unavailable.

## Required implementation

- Define a typed briefing record with covered window, event references,
  sections, generated time, model/rule version, warnings, and expiration.
- Retrieve a bounded event window plus relevant active goals, projects, tasks,
  preferences, and prior feedback under context permissions.
- Rank for relevance, novelty, urgency, and user importance before synthesis;
  do not ask an LLM to discover relevance from an unlimited event dump.
- Generate daily and on-demand briefings through a durable job.
- Require evidence references for each briefing item and discard unsupported
  claims.
- Suppress repeated items unless they changed or remain unresolved and due.
- Add deterministic fallback output when external inference is unavailable;
  label partial/stale source coverage clearly.
- Persist generation status and expose ready, partial, empty, stale, and failed
  states through API and UI.
- Add useful/not useful and incorrect feedback tied to specific briefing
  items.
- Add evaluation fixtures covering relevant, irrelevant, duplicate, stale,
  conflicting, and malicious source content.

## Acceptance criteria

- A briefing built from fixture or staging events cites every surfaced item.
- Duplicate stories and repeated unchanged commitments are not presented as
  separate new developments.
- Missing or failed sources are disclosed.
- Model failure produces a truthful fallback or failed state, never invented
  content.
- User feedback is persisted for future ranking and measurable evaluation.
- Latency, cost, and usefulness metrics required for release thresholds are
  emitted.
