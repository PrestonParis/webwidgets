# V1 Finalization Decision Log

This log records product-scope decisions for finalization. Architecture-level
decisions should also be recorded in `docs/agents/workflow/DECISIONS.md` when
implemented.

## FIN-001: Freeze feature breadth

**Status:** Accepted

**Decision:** Do not add widgets, feature domains, platforms, or disconnected
models until the V1 acceptance criteria pass.

**Reason:** The repository has broad feature coverage but lacks a dependable
end-to-end intelligence and action loop.

## FIN-002: Define V1 by a closed user loop

**Status:** Accepted

**Decision:** V1 is complete when authorized source data becomes an
inspectable timeline, useful briefing, approved action, verified outcome, and
feedback record.

**Reason:** Component count and route presence do not establish product value
or operational completeness.

## FIN-003: Reframe News as Timeline Intelligence

**Status:** Accepted

**Decision:** News remains in V1 but becomes one source type in a broader
personal timeline. V1 will not depend on CNN, NBC, or similar
publisher-specific APIs. External items come from user-selected or
transparent curated RSS/Atom sources.

**Reason:** The system needs a time-ordered view of events relevant to the
user, not a generic publisher feed.

## FIN-004: Suspend entertainment and adjacent experiences in beta

**Status:** Accepted

**Decision:** Chess, Creative/Art Studio, Memorization, and Reading are
suspended beta features. They remain in the codebase but are excluded from
default onboarding, primary V1 navigation, generated workspaces, active
feature development, and V1 completion claims.

**Reason:** They do not contribute directly to the initial timeline,
briefing, task-completion, and automation journeys.

**Implemented:** Prompt 001 centralizes the suspended widget types in the V1
release policy. New default dashboards, onboarding, workspace generation, and
automatic recommendations exclude them. Existing layouts continue to render
them with a Beta label, and deliberate catalog discovery remains available.
Timeline Intelligence remains stable and has its own add-widget category.

## FIN-005: Default to approval before state change

**Status:** Accepted

**Decision:** V1 may observe, suggest, and prepare automatically. State
changes require exact-payload approval except for explicitly enabled,
low-risk automation templates that have passed dry-run.

**Reason:** The existing action framework has safety gates but several real
provider implementations and verification paths are incomplete.

## FIN-006: MCP is an integration option, not a milestone

**Status:** Accepted

**Decision:** Add an MCP server only for a named V1 integration when its tool
or resource contract improves on the existing typed connector/action
boundary. Do not build a general MCP layer as prerequisite infrastructure.

**Reason:** Durable state, worker ownership, permissions, and action
verification are the current bottlenecks; MCP does not solve them.

## FIN-007: Adopt one durable worker and a canonical timeline

**Status:** Accepted

**Decision:** Adopt the runtime and information boundaries in
`OWNERSHIP_PROPOSAL.md` and Active ADR-008 through ADR-011. The existing sync
worker is the foundation for one durable V1 worker; Supabase owns durable
state; timeline owns normalized facts; activity and context are projections;
knowledge and domain records retain their own source truth.

**Reason:** Competing schedules, undispatched worker factories, and overlapping
record concepts prevent dependable ingestion, replay, approval, and verified
task completion.

## FIN-008: Reuse the existing action and job ledgers

**Status:** Accepted and implemented in the repository

**Decision:** Add raw observation, canonical timeline, insight evidence, and
candidate action records, then evolve `integration_connections`, `jobs`,
`automation_runs`, `action_requests`, and `action_results` in place. Approval
binds one exact payload/version atomically; completion requires a verified
outcome. Activity and context remain projections.

**Reason:** The audited existing ledgers have viable ownership and RLS. A
parallel approval, execution, or job database would split idempotency and make
the user-visible result impossible to trace reliably.

## FIN-009: Use Render for the dark V1 worker deployment

**Status:** Accepted production target; free finalization path active

**Decision:** Use the repository Dockerfile and `render.yaml` to provision one
Render background worker plus persistent Render Key Value. Deploy first with
provider processing disabled, dry-run enabled, and Vercel retaining temporary
schedule ownership. Source prompts cut over one schedule at a time.

**Reason:** This is the smallest concrete path that supports the accepted
continuous TypeScript/BullMQ owner, persistent queue delivery, private Redis
connectivity, graceful shutdown, and reproducible infrastructure without
creating another runtime or state machine.

## FIN-010: Use free Render compatibility resources during finalization

**Status:** Accepted

**Decision:** While WebWidgets remains in finalization, deploy the worker image
as a free Render web service backed by free, non-persistent Key Value. Preserve
the dark defaults and use the public `/ready` endpoint for deployment and wake
checks. Upgrade through a deliberate service cutover before production.

**Reason:** This keeps external spend at zero while allowing real integration
testing. It does not weaken the ADR-014 production requirement for continuous
compute and persistent queue delivery.

## FIN-011: Treat RSS as user-controlled timeline evidence

**Status:** Accepted and implemented

**Decision:** Store each user-selected RSS/Atom feed as a canonical integration
connection. Next.js owns authenticated configuration; the V1 worker owns due
source scanning, network-safe fetching, normalization, provenance, health, and
backoff. Persist minimized feed fields and content references, never executable
HTML or prompt instructions. Conservative related-story keys may link likely
matches but never merge distinct source events.

**Reason:** This delivers the first real external timeline vertical slice
without publisher-specific APIs, preserves source control, and keeps untrusted
feed content outside policy and prompt authority.

## FIN-012: Converge email and calendar ingestion on canonical connections

**Status:** Accepted and implemented

**Decision:** `integration_connections` owns provider identity, cursor,
schedule, and health for Gmail, Google Calendar, and Outlook Mail.
`user_email_accounts` remains the server-only credential store and links to one
owner-matched connection. The V1 worker owns polling, normalization, retry,
and canonical timeline persistence. Gmail webhooks only accelerate the next
canonical sync while the legacy email-action queue remains available during
account-by-account cutover.

Outlook Calendar is deferred because the existing Microsoft authorization
requests mail scopes but not a calendar scope. V1 does not silently broaden
existing consent.

The Render worker now runs provider sync with the required OAuth clients. Live
verification completed both canonical jobs with healthy sources and cursors.
Interrupted work is recoverable only after its bounded processing lease
expires, preventing a deployment restart from leaving a source permanently in
`syncing` state.

**Reason:** This removes competing provider state without breaking the existing
inbox action path, gives Prompt 009 one source-health model, and prevents an
unreviewed OAuth-scope expansion.

## FIN-013: Project meaningful internal changes at the database boundary

**Status:** Accepted and implemented

**Decision:** Project meaningful todo, journal, document, artifact, parsing,
and selected automation lifecycle changes into the canonical timeline with
database triggers. Domain records remain source truth. Projections are
forward-only, idempotent by source version, content-minimized, and coalesce
content-only autosaves into 15-minute windows. `activity_events.origin`
prevents a timeline-derived activity record from becoming a new timeline fact.

**Reason:** Internal records can be written through UI, API, import, and
automation paths. One database boundary gives all paths the same semantics
without copying private bodies or maintaining parallel application emitters.

## FIN-014: Render Timeline Intelligence from canonical persistence

**Status:** Accepted and implemented

**Decision:** Keep `/news` and the `news` widget type as compatibility
identifiers while naming the user experience Timeline Intelligence. The web
surface queries only persisted `timeline_events` through an authenticated,
owner-scoped, cursor-paginated API. Connection health is returned separately
so a failed health lookup or unhealthy source cannot erase valid events.

**Reason:** Provider fetches and synthetic demo responses made empty, stale,
and failed states indistinguishable. Canonical reads make chronology,
provenance, partial failure, and user scope inspectable without adding another
feed database.

## FIN-015: Use One Governed Anthropic Inference Boundary

**Status:** Accepted and implemented

**Decision:** Route external V1 summarization and research synthesis through an
authenticated Python container on Render. Next.js owns paid-tier, consent, and
sensitivity decisions. Python owns only bounded validation, rate limiting,
Anthropic invocation, strict output validation, and content-free inference
telemetry. No model may change a schema, permission, or execution decision.

**Reason:** A single real adapter is enough for V1 fallback behavior. Removing
the configured-but-fake provider entries and requiring evidence-linked typed
output gives later briefing and candidate-action work a trustworthy inference
contract without creating an agent loop.

## FIN-016: Keep Briefings Derived, Bounded, and Fully Cited

**Status:** Accepted and implemented

**Decision:** Daily and on-demand briefings are expiring aggregates over a
bounded, deterministically ranked timeline window. Every item requires direct
timeline evidence. Missing inference uses a labeled cited fallback, and source
health controls partial/stale disclosure rather than hiding valid output.

**Reason:** Briefings should compress canonical evidence without becoming a
second fact store or allowing a model to discover relevance from an inbox dump.

## FIN-017: Separate Candidate Review from Action Execution

**Status:** Accepted and implemented

**Decision:** Email commitments can create editable task or calendar
candidates with evidence, confidence, provenance, expiration, and idempotency.
Candidate approval binds the exact payload version and hash but performs no
action. Editing always invalidates prior approval; dismiss and incorrect remain
durable review outcomes.

**Reason:** This gives users useful commitment capture while keeping untrusted
source content and probabilistic extraction outside the execution boundary.

## FIN-018: Make Canonical Storage the Task Execution Receipt

**Status:** Accepted and implemented

**Decision:** Exact task-candidate approval materializes one approved action
request, then the durable worker carries only its canonical ID. A service-only
database function atomically validates owner, approval hash/version, expiry,
and optimistic edit timestamp; mutates `todos`; reads the row back; and records
one verified result. The task row has a unique source action-request receipt.
Create and update support conflict-aware compensation; completion reversal is
not offered in V1.

**Reason:** Redis, HTTP, and workers are all retryable boundaries. Only the
database can prevent a crash between mutation and receipt from creating a
second task while preserving a queryable evidence-to-outcome chain.

## FIN-019: Support Gmail-First Drafts and Explicitly Approved Sending

**Status:** Accepted, deployed, and owner-verified on 2026-08-29

**Decision:** Gmail is the primary V1 email provider. Outlook is secondary,
with draft and sending support as well. This supersedes Prompt 014's original
drafts-only restriction. A draft action never sends; sending is a distinct,
explicitly approved exact-message action. No autonomous sending, automatic
account fallback, or implicit send approval from draft creation is permitted.
Send approval covers account, recipients, subject, body, and reply context;
edits invalidate it. Provider submission is not proof of recipient delivery.

**Prerequisite:** Complete a separately reviewed email credential-isolation
and OAuth account-binding maintenance plan before requesting write/send
permissions. The earlier live audit found raw token columns browser-readable
by their owner; current tracked schema retains that boundary. Additional
permissions require explicit provider re-consent and verified granted scopes.
The owner approved implementing the prerequisite on 2026-08-28. The deployed
cutover and real Gmail reconnect are recorded in `EMAIL_CREDENTIAL_CUTOVER.md`.
This isolates existing email columns without relocating or rotating credential
data. Vault/rotation and other credential tables remain separate maintenance
work.

**Reason:** The owner primarily uses Gmail and wants real email completion.
Broader provider permissions must not bypass the existing human approval
policy or amplify unresolved credential exposure.

## FIN-020: Keep Automation Policy Deterministic and Action Execution Canonical

**Status:** Accepted, implemented, and deployed

**Decision:** Supabase owns automation configuration, pause controls, runs,
approvals, and history. The TypeScript V1 worker owns durable schedule scans
and checks pause controls immediately before mutation. V1 supports one typed
task-creation fixture; its condition is deterministic, its exact payload is
copied at approval, and execution reuses the existing `action_requests`,
`jobs`, `todos`, and `action_results` path. Redis remains delivery only.

**Reason:** A separate automation executor or model-authored policy would split
idempotency and approval semantics. Reusing the canonical action receipt makes
restart, retry, pause, and history behavior independently verifiable.

## FIN-021: Require Measured Release Proof and Human Ownership

**Status:** Accepted; evidence collection active

**Decision:** Freeze numerical V1 launch thresholds before the pilot. Prove the
three V1 journeys with a disposable controlled account and synthetic public
RSS fixture, then require seven complete consecutive days of safe operational
evidence. Any silent data loss, duplicate side effect, fake success, uncited
claim, approval/pause bypass, or critical/high security finding is an automatic
No Go. The implementing agent may collect evidence but cannot approve or merge
the release.

**Reason:** Code presence and green unit tests do not establish product or
operational readiness. A fixed threshold contract, production-like journey
suite, and accountable human decision prevent the release bar from moving in
response to failures.

## FIN-022: Keep Service-Role Clients Stateless

**Status:** Accepted, implemented, and deployed

**Decision:** Request-scoped Supabase clients continue to use the signed-in
user's cookies. Service-role clients are created separately with no cookie
adapter, persisted session, URL session detection, or token refresh. Typed and
untyped variants preserve their existing route contracts while sharing this
stateless authorization boundary.

**Reason:** A service-role client built with the request cookie adapter can
adopt the user's bearer token and silently lose its server-only privileges.
Prompt 19 exposed that downgrade when candidate persistence correctly failed
against authenticated-role grants.
