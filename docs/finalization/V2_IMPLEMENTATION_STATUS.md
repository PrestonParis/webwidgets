# V2 automation implementation status

**Status date:** 2026-09-18  
**Program target:** dependable, policy-bounded level-4 objective execution

## Completion rule

V2 is not complete when the current numbered prompt batch is exhausted. It is
complete only when WebWidgets can repeatedly turn a bounded objective into a
validated plan, execute permitted steps durably, pause for required decisions,
verify postconditions, re-plan without repeating prior effects, and preserve a
coherent execution trace through restarts and provider failures.

The primary release proof is at least three bounded level-4 objectives meeting
the frozen thresholds in `V2_AUTOMATION_EVALUATION_THRESHOLDS.md`. A queue
acknowledgement, provider success response, implemented schema, or merged prompt
does not establish objective completion.

## Foundation batch: V2-001 through V2-008

The first eight delivery slices establish decisions and contracts needed before
goal-driven execution. They are not the full V2 backlog.

| Slice  | Scope                                         | Status on 2026-09-18                          |
| ------ | --------------------------------------------- | --------------------------------------------- |
| V2-001 | Automation control and execution ownership    | Merged                                        |
| V2-002 | Context and memory lifecycles                 | Merged                                        |
| V2-003 | Executable-capability inventory               | Merged                                        |
| V2-004 | V1 execution baseline                         | Merged                                        |
| V2-005 | Automation evaluation thresholds              | Merged                                        |
| V2-006 | Canonical objective and execution schema      | Merged                                        |
| V2-007 | Versioned automation contracts and validators | Merged                                        |
| V2-008 | Production capability registry                | Implemented in PR 37; review and merge remain |

This batch supplies the ownership model, lifecycle boundaries, evidence-based
inventory, evaluation contract, canonical database model, runtime contracts,
and a small registry of production-backed capabilities. It does not yet supply
the planner, policy service, durable V2 orchestrator, re-planning loop, or
level-4 proving-objective evidence.

## Remaining program

Work is sequenced by gates. Later phases may be designed in parallel, but they
cannot be activated before their dependencies pass the frozen evaluation
thresholds.

### Phase 0: operational foundation

- Close the V1 pilot and operations blockers that also affect V2 reliability.
- Enforce CI or record the repository-plan blocker without treating reporting
  as enforcement.
- Prove persistent queue, alert, rollback, restore, and dead-letter recovery.
- Keep incomplete and placeholder capabilities outside planner discovery.

### Phase 1: control plane

- Evaluate policy deterministically against capability version, exact payload,
  consent, connections/scopes, risk, delegation, and remaining budget.
- Persist immutable policy and approval decisions through narrow server-owned
  operations.
- Construct task-scoped context packages with provenance, freshness, untrusted
  content separation, and explicit resource limits.
- Validate complete plan graphs and publish them atomically.
- Expose objective state, evidence, required decisions, and failures through
  the product surface.
- Instrument policy, planning, execution, verification, and intervention
  metrics.

### Phase 2: dependable fixed and branching workflows

- Implement immutable workflow publication, simulation, and unified run traces.
- Add durable dependencies, timers, fan-out/fan-in, cancellation, resumable
  approvals, replay, and unknown-effect reconciliation.
- Add registered postcondition verifiers and compensation for the first
  capability set.
- Implement the Go execution plane, generated contract compatibility, leases,
  heartbeats, backpressure, and the first single-owner job-class cutover.
- Prove three level-2 objectives and two level-3 branching objectives.

### Phase 3: bounded goal-driven execution

- Implement constrained planning over policy-eligible registered capabilities.
- Validate every proposed plan deterministically before publication.
- Select branches from verified results and publish versioned replacement plans
  when reality invalidates pending work.
- Preserve completed and ambiguous effects across plan revisions.
- Handle missing information, conflicting constraints, hostile source content,
  provider failures, and partial completion without unsafe assumptions.
- Prove at least three level-4 objectives across calendar, tasks,
  inbox/context, and files or deliverables.

### Phase 4: recurring delegated objectives

- Add persistent objective state across schedules and source events only after
  level 4 passes.
- Add bounded drift detection, renewal, expiry, checkpoints, and explicit stop
  conditions.
- Permit narrowly delegated reversible actions through understandable policy;
  do not infer delegation from provider scopes or prior approvals.

## Current implementation order

1. Merge V2-008 after independent review.
2. V2-009: deterministic automation policy evaluation.
3. Add narrow policy-decision persistence and exact approval creation.
4. Add full plan-graph validation and atomic publication.
5. Establish Go contract bindings and the dark durable execution runtime.
6. Cut over one level-1 capability class and build the evaluation harness.
7. Advance through fixed, branching, and goal-driven proving objectives only
   when each lower-level gate passes.

The issue tracker is the execution queue. This document is the program ledger;
absence of a numbered issue means work has not yet been decomposed, not that the
work is complete.
