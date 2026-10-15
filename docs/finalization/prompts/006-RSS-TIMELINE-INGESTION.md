# 006 — Persist User-Selected RSS/Atom Timeline Sources

Status: Complete
Priority: Critical  
Depends on: 004 and 005

## Objective

Turn the existing RSS foundation into a real user-controlled timeline source.
A user can add a feed, the worker fetches it on schedule, normalizes and
deduplicates items, persists provenance and source health, and stops fetching
after removal or disconnection.

Pending Prompt 002 approval, the V1 worker owns fetch schedules and processing;
Next.js owns authenticated source configuration. RSS writes raw observations
and canonical timeline facts, with activity/context produced only downstream.

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

## Implementation notes

- Next.js owns authenticated source creation, listing, and disable operations
  through canonical `integration_connections` records.
- The V1 worker scans due sources, creates canonical BullMQ ingestion jobs,
  follows bounded redirects, and validates every hostname and resolved address
  before fetching.
- RSS and Atom normalize into minimized `raw_observations` and user-scoped
  `timeline_events`. Source GUID/link identity, canonical URL, content hash,
  ETag, Last-Modified, revision, health, and exponential backoff are persisted.
- Related-story clustering is deliberately conservative: a metadata link hashes
  normalized title plus publication day. It aids later analysis but never
  merges or deletes distinct events.

## Completion evidence

Completed on 2026-08-17 against the deployed free Render worker and
`webwidgets-dev`:

- A temporary `https://hnrss.org/frontpage` source moved from scheduled to
  healthy through the worker-owned schedule, producing 20 minimized raw
  observations and 20 canonical timeline events.
- A forced second fetch completed as a second canonical job while observation
  and timeline counts remained exactly 20, proving source redelivery
  idempotency.
- Source health reported zero failures, no error code, persisted last success,
  and a 30-minute next attempt.
- Disabling the fixture cleared its next attempt and preserved all 20 historical
  observations and timeline events.
- The 53-migration chain replayed locally; 24 pgTAP assertions passed across
  canonical lifecycle and RSS source RLS/deduplication behavior.
- Worker verification passed 14 tests plus typecheck and formatting. The scoped
  web check and seven RSS URL-policy tests passed. CI's Sync Worker job passed
  on commit `53771317`.

The related-story key intentionally uses only normalized title and publication
day. It can miss reworded coverage and can link same-title stories on the same
day; downstream intelligence must treat it as a hint, never identity.
