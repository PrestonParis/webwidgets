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

**Why:** The owner explicitly chose the Render free plan during finalization.
The worker already exposes an HTTP health server on Render's default port, so
the same container can run as a web service without creating another runtime.

**Consequences:** Before production, replace the web service with the ADR-014
background worker and use persistent Key Value. Because Render service types
are immutable and free-to-paid Key Value upgrades lose in-memory data, perform
that change as an explicit cutover after draining or safely re-enqueuing work.
