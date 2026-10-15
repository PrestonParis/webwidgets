# 011 — Generate Evidence-Backed Daily and On-Demand Briefings

Status: Complete
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

## Completion handoff

WebWidgets now persists daily and on-demand briefing aggregates separately
from canonical timeline facts. A briefing records its covered window,
generation and expiry state, rule/model versions, source warnings, cost,
latency, and item count. Every item has one or more owner-matched timeline
evidence links; unsupported model claims are discarded before persistence.
Item feedback records useful, not useful, or incorrect ratings and emits
content-free usefulness metrics.

The analysis job receives at most 100 windowed timeline events and sends only
the top 20 deterministic relevance/novelty/urgency/importance results to the
governed research-synthesis adapter. Related stories and unchanged prior
fingerprints are suppressed, while unresolved due or retracted items can
remain visible. Provider failure, abstention, malformed evidence, or missing
authorization produces a labeled deterministic fallback. Missing source
health produces a partial briefing; no supported events produces an explicit
empty state; expired output reads as stale.

On-demand requests and user-timezone daily schedules use the same canonical
`briefing.generate` BullMQ job. The worker calls an authenticated internal
Next.js route, preserving ADR-020's authorization boundary. Queued and
dead-letter states project to the briefing record so the API and Timeline
Intelligence UI expose queued, generating, ready, partial, empty, stale, and
failed outcomes. Evaluation fixtures cover relevance, duplicates, repeated
stale content, retractions, malicious text, and unsupported model claims.

Migrations `202608240001_evidence_backed_briefings.sql` and
`202608240002_briefing_feedback_integrity.sql` are deployed to
`webwidgets-dev`; generated types match the live schema. Deployment requires
matching `WORKER_API_TOKEN` values in Vercel and Render, `WORKER_SERVICE_URL`
in Vercel, and the production Vercel URL as `WEB_APP_URL` in Render. Prompt
012 is the next available finalization prompt.
