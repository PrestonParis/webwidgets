# 009 — Deliver the Unified Timeline and Source-Health Experience

Status: Blocked  
Priority: Critical  
Depends on: 006, 007, and 008

## Objective

Replace the empty news feed with a user-scoped Timeline Intelligence
experience that combines personal and selected external events, preserves
chronology/provenance, and makes stale or failed sources visible.

## Required implementation

- Add a validated, authenticated timeline query API with cursor pagination,
  bounded filters, stable ordering, and user scoping.
- Query canonical timeline records rather than fetching providers during page
  render.
- Rework the existing news page/widget into Timeline Intelligence while
  preserving compatible routes where practical.
- Present chronological groups, event type/source filters, related-story
  clusters, provenance links, timestamps, and concise summaries.
- Clearly distinguish occurrence time from ingestion/update time when it
  matters.
- Add source-management and health states: connected, syncing, healthy,
  stale, failing, disabled, and reconnect required.
- Provide loading, initial-empty, filter-empty, stale, offline, permission,
  partial-source-failure, and fatal-error states.
- Avoid rendering untrusted feed HTML. Use sanitized text and safe links.
- Ensure keyboard, screen-reader, dark-mode, and responsive behavior.
- Update naming/catalog/navigation so Timeline Intelligence is not presented
  as entertainment.
- Add API integration tests and focused component/logic tests.

## Non-goals

- Do not add briefing generation, action recommendations, infinite source
  discovery, or social engagement mechanics.
- Do not fetch source data directly from client components.

## Acceptance criteria

- A signed-in user sees events from all completed V1 adapters in one stable,
  paginated timeline.
- No event from another user is returned.
- Duplicate/cluster relationships and provenance are inspectable.
- One failed source does not make healthy-source events disappear.
- The empty API behavior is removed; absence of events is represented as a
  truthful initial-empty state.
- Source status makes stale ingestion understandable without reading logs.
