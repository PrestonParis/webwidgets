# 006 — Persist User-Selected RSS/Atom Timeline Sources

Status: Blocked  
Priority: Critical  
Depends on: 004 and 005

## Objective

Turn the existing RSS foundation into a real user-controlled timeline source.
A user can add a feed, the worker fetches it on schedule, normalizes and
deduplicates items, persists provenance and source health, and stops fetching
after removal or disconnection.

## Required implementation

- Add authenticated source-management APIs and a minimal user-facing source
  configuration flow using canonical source records.
- Validate URLs and block unsafe network targets according to server-side
  request/SSRF policy; do not fetch arbitrary local or metadata addresses.
- Support RSS and Atom through the existing parser boundary.
- Normalize canonical URL, source event ID, author/publisher, title, summary,
  publication/update/fetch times, content reference, and extraction status.
- Persist raw observation/reference and normalized timeline event
  idempotently.
- Add content-hash and URL deduplication plus a conservative related-story
  cluster link; do not silently merge materially different events.
- Store cursor/fetch metadata, ETag/Last-Modified when available, failure
  count, last success, next attempt, and disabled state.
- Schedule through the durable worker with per-source rate limits and backoff.
- Replace the empty provider behavior used by V1; do not add CNN, NBC, or
  other publisher-specific APIs.
- Treat feed content as untrusted and prevent it from controlling prompts,
  policies, or rendered HTML.
- Add unit and integration tests for malformed feeds, duplicate delivery,
  redirects, stale items, unsafe URLs, removal, failure recovery, and
  cross-user access.

## Acceptance criteria

- Adding a valid feed results in persisted, user-scoped timeline events.
- Fetching it repeatedly creates no duplicate event.
- Source provenance and health are queryable.
- Removing/disabling the source prevents future scheduled fetches without
  deleting existing history unless the user requests deletion.
- A failed fetch is visible and retried without erasing previous items.
- No mainstream news-provider API is required for the vertical slice.

## Handoff

Demonstrate one real or fixture feed from configuration through persisted
timeline query. Report network-safety controls and any clustering limitations.
