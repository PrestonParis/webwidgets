# Architecture Decision Records

---

## ADR-001: ML-First, Claude as Paid Fallback

**Status:** Active production target; development deployment amended by ADR-015

**Decision:** In-house TF-IDF + Logistic Regression models run for all users. Claude (Anthropic API) is reserved as a fallback for paid tier only.

**Why:** Cost control and latency. The ML models are fast, free to run, and sufficient for common cases. Claude adds cost per-request that only makes sense for premium features.

**Consequences:** Models must be retrained as new action/widget patterns emerge. Confidence thresholds need tuning as training data grows.

---

## ADR-002: Regex for Field Extraction, ML for Classification

**Status:** Active

**Decision:** ML model determines action _type_ (what intent category). Regex/heuristics extract structured _fields_ (dates, amounts, service names) after classification.

**Why:** ML classifiers generalize across phrasing variations; they should not be expected to reliably extract precise structured data (dates, currency amounts). Regex is deterministic and auditable for field extraction. Mixing these concerns in one regex engine (the prior approach) made the logic brittle and hard to improve.

**Consequences:** Two separate maintenance surfaces. Adding a new action type requires both a new model class (+ training data) and a new extraction helper.

---

## ADR-003: All-Day Date Format for Midnight UTC Calendar Events

**Status:** Active

**Decision:** When creating Google Calendar events, dates that arrive as `T00:00:00Z` (midnight UTC) are converted to all-day `{ date: "YYYY-MM-DD" }` format instead of `{ dateTime: "..." }`.

**Why:** A `dateTime` of midnight UTC displays as the previous day in US timezones (e.g., UTC midnight = 8pm EST on the prior day). All-day events avoid timezone math entirely.

**Consequences:** Events created this way have no time component. If a future source provides a real time alongside a midnight UTC date, detection logic (`/T00:00:00(\.000)?Z$/`) must be updated.

---

## ADR-004: Self-Contained Feature Modules

**Status:** Active

**Decision:** Each feature lives in `features/<name>/` with its own hooks, components, and types. Features do not import from other features. Shared code goes in `lib/`.

**Why:** Prevents tangled dependency graphs. Makes it safe to delete or rewrite a feature without auditing cross-feature impact.

**Consequences:** Some duplication of utility patterns across features is acceptable. If patterns emerge in 3+ features, extract to `lib/`.

---

## ADR-005: Supabase Admin Client for Server-Side Routes Only

**Status:** Active

**Decision:** The Supabase service role key (admin client) is only used inside `/app/api/**` server routes. All client-side reads go through the anon key + RLS.

**Why:** The service role key bypasses RLS. Exposing it to the client would allow any user to read/write any row.

**Consequences:** All user-facing data access must have correct RLS policies. Admin routes must validate the requesting user's identity before acting on their behalf.

---

## ADR-006: sklearn 1.4.2 Pinned Across Training and Inference

**Status:** Active

**Decision:** `requirements.txt` pins `scikit-learn==1.4.2`. The venv must match exactly.

**Why:** sklearn raises `InconsistentVersionWarning` and can produce wrong results when a model is pickled with one version and loaded by another. Mismatches caused warnings with 1.4.1.post1 vs 1.4.2 pickles.

**Consequences:** Upgrading sklearn requires retraining and repickling all three models (`email_classifier.pkl`, `widget_suggester.pkl`, `action_extractor.pkl`).

---

## ADR-007: Action Confidence Threshold at 0.35

**Status:** Active

**Decision:** Actions with classifier confidence below 0.35 are dropped. `ignore` predictions always return no actions regardless of confidence.

**Why:** Initial threshold of 0.45 dropped legitimate payment emails (Klarna-style) that scored ~0.37. The `ignore` class acts as a safety net — lowering the threshold to 0.35 doesn't increase false positives meaningfully because genuinely irrelevant emails are still classified as `ignore`.

**Consequences:** As training data grows, the threshold may need revisiting. Monitor false positive rate for new email types.

---

## ADR-008: One Durable TypeScript Worker for V1 Background Work

**Status:** Active

**Decision:** Extend `services/sync-worker` into the one continuously running
V1 TypeScript/BullMQ worker. It owns source polling, normalization, analysis
jobs, recurring schedules, provider action execution, retries, dead letters,
and worker health. Next.js owns authenticated UI/API, webhook validation,
source configuration, and exact-payload approval. Vercel crons are temporary
cutover fallbacks and must not schedule work also owned by the worker.

If activated, this ADR narrowly amends ADR-005: the Supabase service-role
client may also run inside the dedicated server-only worker. Every operation
must carry an explicit user scope, validate the owning connection or record,
and remain unavailable to browser and shared client-safe modules.

**Why:** The repository has working pieces split across Vercel cron routes,
the sync worker, and undispatched news/action worker factories. A single boot
owner and lifecycle contract prevents duplicate schedules, missing consumers,
and provider work tied to request duration. The existing sync worker has the
strongest reusable BullMQ, token refresh, and shutdown foundation.

**Consequences:** Prompt 005 must select and document a production container
host, add all V1 processors to one explicit entrypoint, implement health and
dead-letter behavior, and cut over schedules one source at a time. The worker
name may remain temporarily even as its role broadens. Service-role access
becomes a reviewed server-runtime exception, not a general shared library.

---

## ADR-009: Separate Source Truth, Timeline, Activity, Knowledge, and Context

**Status:** Active

**Decision:** Provider/domain records and `knowledge_items` remain source truth
for current domain state and user-authored content. A normalized, user-scoped
timeline becomes the canonical history of meaningful facts. `activity_events`
is a recent-activity/notification projection, while `context_entries` and
edges are rebuildable entity/retrieval projections. Projections flow one way
from domain, timeline, knowledge, and verified outcomes and cannot republish
themselves as new timeline facts.

Derived insights and candidate actions must reference their evidence and
model/policy version. Existing `action_requests`, `action_results`, `jobs`,
and automation records should be reused or evolved after the live-schema audit
rather than duplicated solely to match new terminology.

**Why:** Activity is mutable and pruned, context is rewritten by backfills and
entity upserts, and knowledge represents authored content rather than provider
or action events. Treating any one of them as all three roles loses provenance,
creates feedback loops, or duplicates private source bodies.

**Consequences:** Prompt 004 adds only the missing canonical concepts and
relations after Prompt 003 verifies the live schema. Timeline rows minimize
content and reference knowledge/domain bodies. Activity and context can be
rebuilt and must never outlive their source. Existing compatibility reads stay
in place during migration.

---

## ADR-010: Supabase Is Durable Truth; BullMQ Provides At-Least-Once Delivery

**Status:** Active

**Decision:** Supabase Postgres owns canonical lifecycle state, provenance,
user scope, approvals, and verified outcomes. BullMQ/Redis owns delivery,
concurrency, retry timing, and delayed schedules only. Queue jobs reference a
canonical record and deterministic idempotency key. Duplicate delivery is
expected; externally visible effects must remain once from the product's
perspective.

Use proposed V1 defaults of 30 days for raw private payload after successful
normalization, 365 days for normalized timeline events and content-minimized
approval/action/automation history, 30 days for successful job diagnostics,
and 90 days for failed/dead-letter diagnostics. Existing activity archive and
90-day deletion behavior remains a projection policy. Disconnect stops work
and revokes credentials but preserves normalized history by default; removing
imported source data cascades through dependent projections and derived work.

**Why:** Redis retention or restart cannot erase product history. Stable source
identity and persisted state are required to coalesce webhook redelivery,
cursor replay, polling overlap, worker restart, and provider retry safely.
Explicit retention and deletion rules prevent context or derived records from
silently outliving private source data.

**Consequences:** Every processor persists state before acknowledging work,
checks permission immediately before external effects, and records a verified
result rather than treating queue acceptance as success. Prompt 004 must add
constraints, RLS, retention metadata, and cascade/invalidation behavior. The
retention defaults require human approval and later operational enforcement.

---

## ADR-011: Bound Python, n8n, Go, Conversion, and Dashboard Runtime Roles

**Status:** Active

**Decision:** Python serves versioned, bounded, stateless inference requests
and owns no schedules, authorization policy, queues, or product state. n8n is
an optional executor for explicitly configured, validated, approved workflows
and is not an ingestion owner or approval/run database. The Go worker is
disabled and deferred for V1. The conversion service remains a specialized
file-conversion boundary. The dashboard runtime owns rendering and local UI
state only.

**Why:** These components have useful bounded capabilities, but promoting any
of them to general orchestration would create another state machine or depend
on incomplete infrastructure. The Go paths are in-memory stubs, current n8n
callbacks do not reliably transition the originating job, and client runtime
cannot provide durable background execution.

**Consequences:** Prompt 010 must expose Python through one authenticated
container deployment path and exclude fabricated fallbacks from decisions.
Prompt 014 must correlate n8n callbacks to canonical action/job records with
idempotency. Go cannot be a dependency of a V1 acceptance journey and should
only return after a measured requirement and separate decision.

---

## ADR-012: Recover Remote Migration History Without a Squashed Live Dump

**Status:** Active

**Decision:** Establish the WebWidgets schema baseline by recovering and
reviewing the 46 migrations already recorded by `webwidgets-dev`, committing
sanitized historical files under their original versions, and keeping a
schema inventory plus checksum manifest as non-executable evidence. Do not
commit the raw live schema dump as a migration and do not mark historical
objects for recreation. Reconcile the local-only context migration as the next
reviewed successor, then use new additive migrations for remediation.

**Why:** Remote history is recoverable through supported Supabase tooling, but
is absent from the repository. A squashed schema dump would be easy to apply
accidentally, would obscure migration order, and contains environment-specific
function/policy detail. Two recovered historical files also contain email
literals that must not be copied into source control verbatim.

**Consequences:** Baseline recovery is a repository-only task until separately
approved migrations begin. Recovered SQL requires manual security and privacy
review, and sanitized files may intentionally differ from remote checksums with
that difference documented. Type generation happens only after migration
history, live context state, and critical RLS remediation agree.

---

## ADR-013: One Canonical Lifecycle With Existing Execution Ledgers

**Status:** Active

**Decision:** Add only the missing observation, timeline, evidence-linked
insight, and candidate-action records. Evolve `integration_connections`,
`jobs`, `automation_runs`, `action_requests`, and `action_results` in place.
Every derived record has an owner-matched foreign key to required provenance.
Approval is an authenticated atomic transition for one exact payload, version,
permission snapshot, and policy; an action is complete only after a verified
result. Shared persistence contracts live in `apps/web/lib/lifecycle/`.

**Why:** Prompt 003 confirmed the existing execution and operational ledgers
have viable ownership and RLS. Parallel tables would split approval,
idempotency, retry, and provider outcome truth. Composite owner foreign keys
make cross-user provenance invalid even when a record UUID is known.

**Consequences:** Prompt 005 processors persist canonical IDs before queue
acknowledgement and treat BullMQ as delivery only. Activity and context remain
one-way projections. Source-data removal cascades through timeline, insights,
and candidates while content-minimized approval/outcome receipts remain under
the 365-day retention policy. The reviewed bundle was deployed to
`webwidgets-dev` and types were regenerated from live on 2026-08-14.

---

## ADR-014: Render Hosts the Single V1 Worker and Persistent BullMQ Queue

**Status:** Active

**Decision:** Deploy `services/sync-worker` as one Docker background worker on
Render with one paid, persistent Render Key Value instance configured with
`noeviction`. The worker starts the four owned V1 BullMQ consumers from one
entrypoint, exposes container-local liveness/readiness, emits dependency
heartbeats, and receives up to 120 seconds for graceful shutdown. Supabase
`jobs` remains durable truth; Render Key Value holds delivery state only.

The initial deployment is dark: V1 queues and the content-free runtime probe
are enabled, while provider email work is disabled, dry-run is enabled, and
Vercel remains the temporary schedule owner. Source cutover changes both
schedule owners atomically after parity evidence; they never run together.

**Why:** Render directly supports Docker background workers, BullMQ, managed
private Redis-compatible Key Value, infrastructure-as-code Blueprints, and
bounded SIGTERM handling. It gives this monorepo one reproducible worker path
without promoting Vercel requests, n8n, Go, or Redis into orchestration truth.

**Consequences:** `render.yaml` is the supported worker deployment manifest.
Background workers require paid Render resources, so provisioning remains an
explicit owner billing action. Provider credentials remain disabled until the
separate server-only credential remediation lands. Prompt 006 and later source
processors extend the worker registry rather than starting another runtime.

---

## ADR-015: Use Render Free Compatibility Resources During Finalization

**Status:** Active

**Decision:** Until the product is close to release, deploy the same
`services/sync-worker` Docker image as a free Render web service with `/ready`
as its health endpoint and one free `noeviction` Render Key Value instance.
Keep dry-run enabled, provider email work disabled, and Vercel as the schedule
owner. `render.yaml` describes this temporary development topology.

The free service may sleep when idle and the free Key Value instance has no
disk persistence. Supabase `jobs` remains durable truth, but delivery may need
to be re-enqueued after a Key Value restart. This deployment is for integration
and smoke testing, not a claim of continuous or production-safe automation.
The free manifest omits the unsupported custom host shutdown delay and bounds
the process's own shutdown timeout to 25 seconds.

**Why:** The owner explicitly chose the Render free plan during finalization.
The worker already exposes an HTTP health server on Render's default port, so
the same container can run as a web service without creating another runtime.

**Consequences:** Before production, replace the web service with the ADR-014
background worker and use persistent Key Value. Because Render service types
are immutable and free-to-paid Key Value upgrades lose in-memory data, perform
that change as an explicit cutover after draining or safely re-enqueuing work.

---

## ADR-016: Worker-Owned RSS Sources Use Canonical Integration State

**Status:** Active

**Decision:** Represent each RSS/Atom feed as an `integration_connections` row
identified by the owner, provider, and canonical URL hash. Authenticated
Next.js routes create, list, and disable sources. The V1 worker scans due rows,
creates canonical ingestion jobs, validates every hostname, resolved address,
and redirect, then persists minimized observations and timeline events before
recording success. ETag, Last-Modified, failure count, backoff, and next attempt
remain source state in Supabase.

Feed bodies are untrusted input. The worker strips markup, stores references
rather than rendered HTML, and marks the resulting metadata as untrusted. A
title-and-day related-story hash is a non-destructive link only; it cannot
collapse events or influence permissions.

**Why:** RSS is the smallest transparent external source that proves the V1
configuration-to-timeline loop without a publisher API. Canonical connection
state preserves user control and makes retries, deduplication, and health
queryable independently of Redis delivery history.

**Consequences:** The prior one-row-per-provider uniqueness rule becomes
owner/provider/external-account uniqueness while preserving one null external
account for legacy providers. Production still requires ADR-014's continuous
worker and persistent queue; the free finalization service may sleep.

---

## ADR-017: Provider Signals Converge on Canonical Connection State

**Status:** Active

**Decision:** Link each Google or Microsoft credential row in
`user_email_accounts` to one owner-matched `integration_connections` row.
Canonical connection state owns scheduling, incremental cursor, source health,
failure backoff, and disconnect status. The V1 worker owns Gmail, Google
Calendar, and Outlook Mail polling and normalization into `raw_observations`
and `timeline_events`. Gmail webhooks validate notifications and accelerate the
same connection schedule; the existing Gmail queue remains a temporary
projection for established inbox actions during cutover.

Provider object/version identity is account-scoped and idempotent. Disconnect
is an authenticated atomic operation that disables future scheduling and
removes credentials while retaining already-normalized history. The worker
rechecks connection state between signal writes and never records a successful
cursor advance after an interrupted disconnect.

Outlook Calendar is not part of this contract because the existing Microsoft
OAuth flow grants mail access only. Adding calendar ingestion requires an
explicit consent change and separate review.

**Why:** Provider credentials, cursor state, health, webhook scheduling, and
timeline identity previously lived in overlapping paths. A single connection
owner permits safe replay, source-health UI, and prompt-level cutover without
discarding the working inbox-action behavior.

**Consequences:** Render holds the provider OAuth client credentials and runs
with `PROVIDER_SYNC_ENABLED=true`. Live ingestion, replay deduplication, source
health, cursor persistence, and restart recovery are proven. Disconnect remains
an owner-only atomic operation covered by database and worker integration
tests. Legacy processors retire account by account rather than through an
unverified global switch.

The initial existing-account backfill required a successor migration because a
data-changing CTE and its outer update shared one PostgreSQL snapshot. Keeping
the insert and update as separate statements linked the two live credential
rows without rewriting deployed migration history.

A back-to-back Render deployment also proved that queue delivery and canonical
job state need separate recovery. A worker may reclaim a `running` canonical
job only after the processing timeout plus a lease buffer, and removes a
failed BullMQ delivery before redelivery.

---

## ADR-018: Internal State Projects into the Timeline at the Database Boundary

**Status:** Active

**Decision:** Use database triggers to project meaningful todo, journal,
document, artifact, parse, and selected automation transitions into
`raw_observations` and `timeline_events`. Domain and knowledge rows remain
source truth. Projection identity includes the source version; content-only
autosaves share a 15-minute version bucket. No automatic historical backfill
is performed.

Projection payloads contain source references and bounded change metadata,
never note, journal, document, extraction, or error bodies. Deletion retracts
prior active events, clears raw payloads, and records only a minimal tombstone.
`activity_events.origin` is one-way provenance: records originating from a
timeline projection cannot generate another timeline event.

**Why:** Internal state has multiple valid write paths. A database boundary
applies one idempotent contract to UI, API, import, and automation writes while
avoiding duplicate application emitters and private-content replication.

**Consequences:** Prompt 009 can query one event model without feature joins.
Any future direct writer inherits the projection contract. A requested
historical import must be separately bounded and user-authorized.

---

## ADR-019: Timeline Reads Use One Owner-Scoped Canonical API

**Status:** Active

**Decision:** The `/news` route and `news` widget remain stable identifiers,
but their V1 surface is Timeline Intelligence. They read persisted
`timeline_events` through one authenticated API with explicit owner scope,
retention/state constraints, bounded filters, and stable ordering by
`occurred_at DESC, id DESC`. Opaque cursors carry only that ordering boundary.
Provider APIs are never called during page render.

Source health is derived from `integration_connections` and returned as a
separate recoverable result. External titles and summaries render only as
bounded text; provenance links are limited to HTTP(S). Related-story keys
expose links among events but do not merge their identity.

**Why:** A canonical read boundary prevents provider availability, demo data,
or ranking services from changing timeline truth. Separate health failure lets
healthy-source events remain useful when one connection needs attention.

**Consequences:** Briefing and action prompts can consume the same event model.
The route retains its historical URL, while catalog, help, widget, and page
language consistently present Timeline Intelligence.

---

## ADR-020: Govern External Inference at the Next.js Boundary

**Status:** Active

**Decision:** Use one authenticated Python container on Render for bounded
Anthropic summarization and research synthesis. Next.js determines paid-tier
eligibility, explicit consent, task schema, and sensitivity before sending any
source data. Python is stateless and may validate, rate-limit, call the model,
and return typed output; it may not grant permission, schedule work, persist
canonical state, or invoke actions. The production container exposes only its
authenticated V1 inference routes.

**Why:** The existing registry falsely marked configured placeholder providers
as available, while direct feature-specific vendor clients duplicated policy
and leaked provider behavior into callers. One narrow boundary makes real
availability, cost, failure, abstention, and model provenance inspectable.

**Consequences:** Anthropic is the sole external V1 provider and remains a paid
fallback under ADR-001. OpenAI, Gemini, and local placeholders are unavailable
until they implement the same contract. Audit and cost records contain hashes
and metadata, never prompts. Free Render sleep latency is accepted during
finalization but is not the production availability target.

---

## ADR-021: Persist Briefings as Evidence-Linked Derived Aggregates

**Status:** Active

**Decision:** Persist daily and on-demand briefings separately from canonical
timeline facts. Deterministic ranking bounds input before governed inference,
every surfaced item links owner-matched timeline evidence, and unsupported
output is discarded. Provider failure uses cited deterministic fallback;
source impairment and empty, stale, partial, or failed output remain explicit
states. One canonical worker job owns scheduled and on-demand generation.

**Why:** A briefing is an expiring interpretation, not source truth. Separate
records preserve replay, provenance, honest degradation, feedback, and cost
measurement without rewriting the timeline.

**Consequences:** Models cannot invent uncited briefing claims. Item feedback
is measurable without altering evidence. Briefing records can expire or be
deleted independently of canonical source events.

---

## ADR-022: Candidate Approval Binds an Exact Editable Payload Without Execution

**Status:** Active

**Decision:** Commitment detection creates expiring `candidate_actions` backed
by an insight and direct timeline evidence. Deterministic extraction handles
clear dated requests; governed external resolution receives only bounded
ambiguous signals. Candidate edits atomically increment payload version and
invalidate approval. Approval stores the exact current payload hash/version
but creates no action request and invokes no handler.

**Why:** Untrusted mail can suggest work but must never approve or execute it.
Exact-version review prevents a later edit, retry, or model rerun from reusing a
stale human decision.

**Consequences:** Prompts 013 and 014 may execute only by creating a separate
idempotent action request from an approved exact candidate. Dismissed and
incorrect decisions remain measurable, and cross-owner evidence is rejected by
composite foreign keys and RLS.

---

## ADR-023: Task Mutations Converge on an Atomic Product Receipt

**Status:** Active

**Decision:** An exact approved task candidate materializes one canonical
`action_requests` record before delivery. The V1 worker receives only that
record's ID. A service-only database function revalidates its approval
hash/version, owner, expiry, and optimistic edit timestamp; performs
`tasks.create`, `tasks.update`, or `tasks.complete` against `todos`; reads the
row back; and records one verified `action_results` receipt. A unique
`todos.source_action_request_id` makes canonical storage the final idempotency
boundary. Browser sessions may review, read outcomes, retry the same request,
or request supported compensation, but cannot invoke task mutation directly.

**Why:** BullMQ provides at-least-once delivery. An application-only receipt
can still duplicate a task if a process stops after insertion but before
recording success. The atomic database boundary makes approval, execution,
verification, replay, and traceability agree.

**Consequences:** Create and update expose safe undo only while the verified
task has not changed again. Completion reversal is deliberately unavailable
in V1. Direct action envelopes cannot claim task success; they must enter via
an approved canonical request. Prompt 014 shares the request/result and worker
contracts but must define connector-specific receipts independently.

---

## ADR-024: Isolate Existing Email Credentials Before Increasing OAuth Capability

**Status:** Active; deployed

**Decision:** Remove browser table/column access to email secrets in both
credential tables, retaining an explicit owner-only metadata allowlist. Keep
existing credential rows and legacy mirrors during this access-control cutover.
API helpers verify the current user before creating a cookie-free service
client; resolver wrappers return product snapshots, never credentials. Do not
change the shared cookie-bound Supabase clients globally. Worker reads remain
account/user scoped.

OAuth account connection uses a one-use user/provider-bound nonce, expiry,
PKCE, safe local redirects, provider-verified identity and actual scopes.
Atomic persistence preserves other providers and never pairs one mailbox's
access token with another mailbox's refresh token. Browser session cookies are
rebuilt from Supabase-only tokens before being emitted.

**Why:** Sending-capable tokens must not amplify the existing browser-secret
exposure or query-string OAuth owner binding. Reusing the existing tables with
restrictive grants avoids a simultaneous credential relocation/rotation.

**Consequences:** Write scopes are requested only from an explicit capability
upgrade and persisted from the provider's actual grant. This is not encryption/Vault
migration or resolution of other secret-table findings. See
`docs/finalization/EMAIL_CREDENTIAL_CUTOVER.md` for evidence and recovery rules.

---

## ADR-025: Reserve External Side Effects Once and Reconcile Canonically

**Status:** Active

**Decision:** Email, calendar, and configured workflow actions enter through a
canonical action request whose exact provider, account, recipients or event/
workflow parameters, payload hash, and version are approved by the owner.
Approval creates a durable worker job. A service-only claim reserves each
external operation once; retries may inspect provider state but cannot reserve
or dispatch it again. Safe receipts live in `action_results` and dedicated
dispatch ledgers. Gmail is primary; Outlook supports the bounded new-message
draft/send journey. Sending is always a separate action and approval.

Google Calendar uses a deterministic event ID and verified read-back. n8n is
an optional allowlisted executor whose signed callback must match the canonical
user, request, job, idempotency key, and provider run. An ambiguous initial n8n
response can be resolved only by that callback, never by blind retriggering.

**Why:** BullMQ is at-least-once and provider writes are outside the database
transaction. Approval alone does not prevent duplicates if a process stops
between a provider response and receipt persistence.

**Consequences:** Provider-specific unknown states remain visible and require
reconciliation. A draft can never inherit send approval; send has no promised
undo. Calendar cancellation is a separate explicit action. Legacy direct
workflow triggering returns a canonical-approval-required error.

---

## ADR-026: Treat Release Readiness as Measured State, Not a Build Flag

**Status:** Active

**Decision:** The V1 release gate combines a disposable-account production-like
E2E suite, frozen numerical thresholds, seven consecutive daily evidence
windows, repository enforcement, production topology, and a human release
owner. The suite uses only synthetic committed fixture content and deletes its
account. CI configuration without enforced required checks is reported as an
external blocker, not treated as protection.

**Why:** Durable jobs and exact receipts can be correct in isolation while the
deployed product still loses data, sleeps through schedules, duplicates an
effect, or presents an unhealthy source as healthy. Release readiness is an
observed operational property and needs an accountable decision owner.

**Consequences:** Prompt 19 remains incomplete until all seven pilot days and
human approval exist. Missing evidence restarts the consecutive-day count.
Agents can recommend Go, Conditional Go, or No Go but cannot self-certify or
merge their own release PR.

---

## ADR-027: Separate the V2 Control Plane from Go-Owned Durable Execution

**Status:** Active V2 target

**Decision:** WebWidgets V2 uses three explicit architectural planes:

1. The Next.js/TypeScript application owns the authenticated control plane.
2. Supabase Postgres owns canonical automation state and immutable evidence.
3. The Go worker owns durable orchestration and execution advancement.

This decision extends the V1 ownership established by ADR-008 and ADR-010; it
does not retroactively move V1 job classes before their explicit cutover.

### Responsibility and mutation ownership

| Responsibility or canonical record                               | Sole V2 owner                                                | Required boundary                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Objective creation, edits, submission, pause, resume, archive    | Next.js control plane                                        | Authenticated, tenant-scoped API and transactional database functions                              |
| Objective and objective-version rows                             | Next.js control plane                                        | A submitted version is immutable; edits create a version                                           |
| Capability discovery and plan construction                       | Next.js control plane                                        | Uses only registered versioned capabilities; emits data, never provider calls                      |
| Plan, plan-step, dependency, and plan-version rows               | Next.js control plane                                        | Validate the complete graph before atomic publication                                              |
| Policy evaluation and policy-decision rows                       | Next.js control plane                                        | Deterministic evaluation binds user, tenant, capability version, payload hash, consent, and budget |
| Approval request and approval-decision rows                      | Next.js control plane                                        | Approval covers one normalized payload/version and cannot be broadened by a worker                 |
| Domain/webhook intake and transactional outbox creation          | Next.js or the owning domain transaction                     | Verify the caller or provider first; commit domain state and outbox atomically                     |
| V2 outbox consumption and event correlation                      | Go execution plane                                           | At-least-once intake; canonical event identity makes replay safe                                   |
| Run and attempt lifecycle after submission                       | Go execution plane                                           | State transitions use leases and compare-and-set database functions                                |
| Leases, heartbeats, timers, dependency readiness, fan-out/fan-in | Go execution plane                                           | Durable database state; process memory and queue delays are advisory                               |
| Capability dispatch and retry decisions                          | Go execution plane                                           | A pinned capability version and current allow decision are required                                |
| External side-effect reservation                                 | Go execution plane                                           | Reserve an idempotency key canonically before invoking an adapter                                  |
| Capability implementation                                        | Registered bounded executor                                  | Invoked only by Go for V2; returns a typed result and cannot advance workflow state                |
| Attempt results, side-effect receipts, normalized errors         | Go execution plane                                           | Go validates adapter output and is the only canonical writer                                       |
| Postcondition verification and verification rows                 | Go execution plane                                           | A registered verifier may perform the read, but Go persists the verdict                            |
| Re-planning trigger and invalidation evidence                    | Go execution plane                                           | Records the observed mismatch and blocks affected pending steps                                    |
| Replacement plan publication and policy evaluation               | Next.js control plane                                        | Creates a new immutable plan version; never rewrites the active version                            |
| Cancellation request                                             | Next.js control plane                                        | Durable user/policy intent with an idempotent request key                                          |
| Cancellation propagation and terminal execution state            | Go execution plane                                           | Stops eligible work, preserves completed effects, and reconciles in-flight effects                 |
| Execution audit and immutable evidence                           | Go execution plane through append-only database functions    | Content-minimized, tenant-scoped, versioned, and never rewritten by adapters                       |
| Control-plane audit                                              | Next.js control plane through append-only database functions | Records intent, policy, approval, and plan publication separately from execution evidence          |

The database functions that enforce these transitions are part of the
Supabase truth boundary. Service-role access does not confer ownership: only
the named control-plane or Go operation may call its corresponding mutation.
RLS protects user reads and writes, while narrow service functions enforce
cross-record invariants for privileged transitions.

### Component boundaries

- `apps/web` owns customer APIs, the capability registry, deterministic policy,
  approval, plan validation/publication, queries, and control-plane audit. API
  routes remain adapters over server services and cannot contain planning or
  execution logic.
- `services/go_services/worker` becomes a separately deployed, continuously
  running execution service. It must expose health/readiness, use bounded
  database credentials, maintain durable leases and heartbeats, and shut down
  by relinquishing or allowing leases to expire safely.
- `services/sync-worker` continues to own non-cut-over V1 classes. After a class
  is activated for Go it cannot scan, claim, enqueue, retry, or reconcile that
  class. Shared provider code may be retained behind an internal capability
  endpoint, but it has no scheduling authority.
- `services/ml_service` may classify, extract, rank, or propose plan material.
  It is stateless, receives a bounded context package, and cannot authorize,
  persist canonical automation state, dispatch, or claim completion.
- `services/conversion` executes bounded conversion capabilities and may retain
  its existing internal job database. The V2 result is not complete until Go
  records and verifies the canonical receipt in Supabase.
- Redis/BullMQ may carry wakeups, work references, concurrency signals, and
  backpressure. Loss, duplication, or expiry in Redis cannot lose or mutate
  canonical work; reconciliation starts from Supabase.
- n8n may execute only an allowlisted, versioned capability through signed
  requests and correlated callbacks. It never owns triggers, plans, approvals,
  retries, timers, or V2 run state.

### Planning, execution, verification, and re-planning

The planner consumes an immutable objective version, task-scoped context
package, available capability versions, policy inputs, and resource budget. It
produces a typed dependency graph. The control plane validates the whole graph,
persists its policy decisions, and publishes it atomically. Publication makes
the plan eligible for Go; it does not execute it.

Go pins every run to the published plan and capability versions. Immediately
before dispatch it confirms the bound policy decision is still applicable and
that approval, consent, connection scope, cancellation state, and budget have
not become stale. It reserves an attempt and any external side effect before
calling the registered executor. Provider acceptance is not completion. Go
records a successful step only after the registered verifier establishes its
postcondition or policy explicitly permits an accepted-unverifiable terminal
result.

When observed state invalidates a pending plan, Go records immutable
invalidation evidence and requests re-planning. Next.js constructs, validates,
and publishes a new plan version that references completed effects and blocked
steps. Go never authors a plan; Next.js never dispatches one. A revision cannot
silently repeat a completed or ambiguously completed side effect.

### Failure domains

- A Next.js outage blocks new control-plane commands but does not erase or
  transfer ownership of running work. Go may continue only steps whose policy,
  approval, connection, and plan validity can still be established.
- A Go outage leaves canonical attempts, leases, timers, and ready steps in
  Supabase. A restarted replica resumes only after acquiring the canonical
  lease and reconciling ambiguous effects.
- A Supabase outage stops state advancement and external dispatch. No component
  may execute from queue state alone.
- Redis/BullMQ loss delays wakeups. A Go reconciliation scan recovers ready,
  expired-lease, and timer work from canonical state without duplicate effects.
- Executor failure returns a normalized typed error. Retry, compensation,
  decision request, or failure is chosen by Go from the pinned policy.
- Provider timeout after a possible side effect creates an unknown outcome.
  The verifier or reconciliation path must resolve it; blind retry is forbidden.

### Versioning and deployment

Objectives, plans, capability contracts, events, policy decisions, and
verification contracts carry explicit versions. Published plan and capability
versions are immutable while referenced by an active or retained run. Web and
Go deployments must pass shared fixture compatibility tests before rollout.
Unknown versions fail closed before dispatch.

Next.js, Go, TypeScript worker, Python, and conversion deploy independently.
Go deploys dark before a cutover: it may validate connectivity, compatibility,
and reconciliation queries but cannot claim the target class. Deployment
success does not alter job ownership.

### V1-to-V2 job-class transition

Each schedulable or executable job class has one canonical ownership record
with `v1_typescript` or `v2_go` as its active owner and an epoch used in claims.
No `dual` state exists.

1. Inventory the V1 trigger, scanner, queue, handler, idempotency key, receipt,
   and recovery path for the class.
2. Implement the V2 contract, Go handler/orchestration path, verifier,
   reconciliation, telemetry, and compatibility tests.
3. Deploy Go dark and replay production-shaped fixtures without claims or side
   effects.
4. Pause new V1 scheduling for the class and drain or reconcile its in-flight
   jobs.
5. Atomically advance the ownership epoch to `v2_go`. Go may then claim; V1
   entry points must reject the new epoch.
6. Observe the class against release thresholds before retiring its V1 code.

Rollback disables new Go claims, drains or expires Go leases, reconciles every
reserved external effect, and atomically advances a new epoch back to
`v1_typescript`. It never runs both owners to discover which works. Schema and
immutable evidence remain forward-compatible; rollback changes the active
owner, not historical records.

**Why:** V1 safely centralizes work in a TypeScript/BullMQ worker, but V2
objectives span restarts, timers, dependencies, callbacks, verification, and
re-planning. Assigning Go sole execution ownership makes that complexity one
program's responsibility while retaining the working provider and inference
components as bounded adapters. Exact mutation ownership prevents queue state,
provider success, or competing schedulers from becoming conflicting truth.

**Consequences:** Go is mandatory for V2 execution and must be deployed as a
real continuously running service before any V2 class is activated. The first
implementation work must establish versioned contracts, canonical schema,
ownership gates, compatibility tests, and a dark Go runtime. V1 continues
unchanged until each class meets its cutover gate. The context and memory
lifecycle remains a separate decision in ADR-028.

---

## ADR-028: Separate Context, Memory, and Execution-Evidence Lifecycles

**Status:** Active V2 target

**Decision:** V2 keeps five data classes separate in schemas, runtime
contracts, access policy, retention, and product language:

1. raw source and domain records;
2. durable user-authored facts and preferences;
3. inferred context;
4. objective-local working memory; and
5. immutable execution evidence.

`context_entries` and context edges are inferred/rebuildable retrieval
projections. `knowledge_items` and owning domain tables remain durable source
truth. An objective receives an immutable, task-scoped context package built
from these sources; it never receives unrestricted account memory. This
decision completes ADR-009 for V2 and uses the control/execution ownership in
ADR-027.

### Lifecycle contract

| Class                           | Source of truth and provenance                                                                                                                                                                    | Confidence and freshness                                                                                                                                                                               | Correction and deletion                                                                                                                                                                                               | Default retention                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raw source/domain records       | Owning provider object or WebWidgets domain row; record user/workspace, connection, provider/object identity, occurrence and observation times, parser version, and content hash                  | Observed fields are not assigned model confidence; parsed/normalized claims identify parser confidence where applicable; freshness is measured from provider occurrence and successful observation     | Provider refresh may supersede a version but cannot rewrite historical provenance; source deletion cascades to copied payloads and dependent projections; disconnect stops new access and work                        | Private raw payload is deleted within 30 days after successful normalization; minimized identity/hash metadata follows the source dedupe policy; normalized domain content follows its owning feature rule |
| User-authored facts/preferences | Authenticated user command, import explicitly accepted as authored, or a user-approved conversion from a proposal; record author, scope, version, and effective time                              | User authorship is authority, not a probability score; freshness is the latest effective non-revoked version and may include an explicit expiry                                                        | Correction creates a new version or revocation linked to the prior version; deletion removes content and invalidates dependent packages/projections                                                                   | Until explicit deletion, revocation, expiry, account deletion, or the owning domain's documented rule                                                                                                      |
| Inferred context                | Evidence-linked rule/model output such as context entries, edges, insights, rankings, summaries, or candidates; record source versions, rule/model/prompt version, generated time, and provenance | Numeric confidence is required where the inference is probabilistic; every inference has `last_verified_at` and/or `expires_at`; an expired inference is unavailable, not silently refreshed           | Rejection records feedback and invalidates or supersedes the inference; rebuilding creates a new projection version; an inference can become a durable fact only through a separate explicit authenticated user write | Until its declared expiry, source deletion, consent withdrawal, supersession, or a shorter feature policy; never longer than required source access                                                        |
| Objective-local working memory  | One objective/run, context-package ID, plan version, attempt, and producing step; append checkpoints rather than overwrite provenance                                                             | No standalone truth/confidence claim; every item is a typed intermediate value or reference with creation time and source lineage; stale items are excluded after plan revision or source invalidation | A plan revision supersedes entries without rewriting them; cancellation blocks new writes; source deletion purges copied content and leaves only a minimal invalidation marker where audit requires it                | Active objective lifetime plus 30 days after terminal state for bounded recovery/debugging, then content deletion; hashes and references survive only when required by retained execution evidence         |
| Execution evidence              | Go-owned append-only attempt results, side-effect reservations/receipts, policy and approval references, verifier observations, compensation records, and plan lineage                            | Evidence reports observed state and verifier outcome, not model confidence; timestamps, contract versions, and verification freshness are mandatory                                                    | No ordinary update or user edit; correction appends a superseding evidence record without deleting the original; content is removed only by the documented retention or account/data-deletion process                 | Content-minimized evidence follows ADR-010's 365-day V1 baseline until a later approved policy changes it; account deletion and explicit source-data deletion run the documented purge/tombstone process   |

Retention periods are maximum defaults, not permission to retain data that is
no longer authorized or necessary. Legal hold or regulatory exceptions require
a separately documented policy and cannot be inferred by an agent or worker.

### Durable fact and preference boundary

A durable fact or preference requires an authenticated user-originated command
whose UI/API identifies the value, scope, effective time, and whether it
expires. Imports count as authored only after the user accepts that
classification. Provider data remains provider/domain truth even when the user
connects it. Model output, source text, inferred relationships, action success,
and repeated behavior cannot silently create or modify a durable preference.

When V2 offers to remember an inference, it creates a proposal referencing the
inference and evidence. Acceptance creates a new authored record with its own
version and audit entry; it does not mutate the inference into a fact. Rejection
may tune ranking or suppress the proposal but cannot rewrite source evidence.

### Task-scoped context package

The Next.js control plane assembles a context package before planning or
re-planning. The package request is versioned and includes:

- immutable objective and objective-version IDs;
- requesting user and workspace;
- intended planner/capability purpose;
- permitted source classes and entity/domain filters;
- maximum age per source class and the package `as_of` time;
- consent and connection-scope snapshot IDs;
- policy and redaction-policy versions;
- resource limits; and
- prior verified result references allowed for this objective.

The builder performs owner/workspace and consent checks before retrieval. It
uses the authenticated user client and RLS for ordinary reads; a privileged
server function may be used only when it accepts explicit user/workspace scope
and enforces equivalent ownership. Capability access is least privilege: a
planner cannot include a source merely because another connected capability
could read it.

The first V2 package contract uses these hard ceilings:

- at most 64 evidence items;
- at most 48 KiB of serialized untrusted source excerpts;
- at most 8 KiB of authenticated user-authored facts/preferences;
- at most 64 KiB total serialized content and metadata; and
- at most 12,000 model-input tokens after deterministic rendering.

The lowest applicable ceiling wins. Capability contracts may require smaller
limits but cannot enlarge them. Each requested source class must provide an
explicit `max_age`; absent freshness policy excludes that class rather than
using an implicit default. A record is also excluded when expired, deleted,
revoked, outside consent, outside tenant scope, or older than the capability's
stricter bound. The package records every exclusion reason without copying the
excluded content.

Selection is deterministic for a given request and source snapshot: filter by
access/freshness first, deduplicate by canonical source identity, rank using a
versioned deterministic scorer, then order ties by event time and stable ID.
The package ID is a digest of the package-contract version, objective version,
policy/consent snapshots, selection parameters, and selected source
IDs/versions/content hashes. Identical inputs and source state therefore
produce the same identity. The complete immutable package is persisted so the
plan and every attempt can name the exact context used.

### Trust and prompt-injection boundary

Context is represented as typed lanes rather than one concatenated prompt:

1. code-owned system and safety instructions;
2. authenticated user objective and explicitly authored preferences;
3. control metadata such as schemas, capability contracts, and budgets; and
4. untrusted evidence from providers, files, messages, feeds, pages, prior
   model output, and tool output.

Every untrusted item carries its source ID, media/content type, bounded excerpt,
hash, timestamps, and an explicit `untrusted` label. Rendering uses structural
delimiters and escaping appropriate to the model adapter. Text inside evidence
that resembles instructions remains evidence. It cannot grant scopes, select
an unavailable capability, change a budget, alter approval requirements,
request secrets, or change system/user instruction priority.

Planner and model output is also untrusted until it passes strict versioned
schema validation, capability registration, policy evaluation, and plan-graph
validation. Prompt injection that produces a valid-looking request still
cannot cross tenant, consent, capability, policy, approval, or Go dispatch
boundaries. Raw provider errors and secrets never enter a package.

### Working-memory and write-back rules

Objective-local working memory exists only to resume and explain one objective.
It may contain typed intermediate values, bounded derived summaries, selected
branch conditions, verifier inputs, and references to completed attempts. It
cannot be searched as general user memory, used by another objective without a
new authorized context package, or written into source/domain tables directly.

After a run, only these write-backs are allowed:

- Go appends normalized execution evidence and verified domain side-effect
  receipts under ADR-027.
- A registered inference producer may create an evidence-linked, expiring
  inferred-context record through the control-plane contract.
- The product may append user feedback, rejection, or correction records.
- An authenticated user action may create a new authored fact/preference from
  a clearly displayed proposal.
- A registered capability may mutate its named domain record only after policy,
  approval where required, idempotent execution, and verification.

Source content, model output, working memory, and adapters cannot write policy,
consent, approval, capability definitions, authored memory, or completion
state. Go is the sole writer of V2 execution advancement; the Next.js control
plane is the sole writer of authored/context-control records as assigned by
ADR-027.

### Invalidation, deletion, and account erasure

Source update or correction creates a new source version and invalidates
derived context whose provenance no longer matches. New plans cannot use an
invalidated package. A running attempt may finish only when its capability and
policy explicitly permit the stale snapshot; otherwise Go blocks it and
requests re-planning.

Deleting imported/source data removes raw bodies and copied excerpts from
context packages and working memory, cascades or invalidates inferred
projections, and prevents future retrieval. Historical execution evidence
retains only the minimum source ID/hash, deletion time, and verifier/receipt
metadata needed to explain an already completed external effect. It cannot
retain the deleted source body.

Account deletion is an ordered, auditable operation: pause objectives, stop new
claims, reconcile in-flight external effects, revoke provider credentials,
delete raw/domain/authored/inferred/working-memory content, then delete or
cryptographically erase execution evidence and audit tombstones according to
the account-deletion policy. A partial failure is retryable from durable purge
state. Backups expire under the documented backup lifecycle and are not used
for product retrieval after deletion.

All five classes use composite owner/workspace provenance and RLS. Service-role
workers and maintenance jobs receive explicit tenant scope and use narrow
database functions; possession of a service credential never authorizes a
cross-tenant context scan. Consent withdrawal invalidates affected packages
and stops new planning immediately, then purges copied content according to the
same source-deletion rules.

**Why:** V1 correctly separates domain truth, timeline, knowledge, activity,
and context projections, but “AI memory” still risks collapsing authored truth,
inference, transient planning state, and audit receipts. V2 automation cannot
plan reproducibly or respect correction and deletion if those lifecycles are
interchangeable. Typed packages give each objective enough context without
granting unrestricted access or letting hostile content become instructions.

**Consequences:** V2 schema and contract work must model these classes and
references explicitly. Context assembly is deterministic, access-scoped, and
budgeted. Inference never silently becomes a durable fact. Working memory is
objective-local and expiring. Execution evidence is immutable until a
documented retention/account-deletion operation removes it. Existing context
graph rows remain projections and require migration/reconciliation rather than
being promoted to source truth.
