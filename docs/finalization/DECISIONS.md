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

## Pending implementation decisions

- Complete the separate provider credential-isolation remediation.
- Set measurable launch thresholds for intelligence precision, duplicate
  rate, latency, reliability, and inference cost.

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
