# V2 plan publication

V2-011 adds the publication boundary for complete objective-plan graphs. It
does not add a planner or execute a published plan.

## Validation contract

`validatePlanGraph` validates a server-loaded graph before publication. A
publishable graph must:

- use the V2 contract and remain in draft state;
- contain 1–100 uniquely identified, contiguously ordered steps and no more
  than 400 dependencies;
- keep every step and dependency inside the same plan, objective, and owner;
- reference existing, active capability versions with the registered risk
  class;
- contain normalized capability inputs whose stored hashes match exactly;
- form a directed acyclic graph with no missing, duplicate, or self edges;
- match the canonical hash of the contract version, immutable plan-root
  definition, complete ordered steps, and dependencies.

The authenticated route accepts only the contract version and the caller's
expected graph hash. It loads the graph with owner predicates through the
server-side client; callers cannot supply or replace steps during publication.

## Atomic database boundary

`publish_v2_objective_plan` is executable only by the service role. In one
transaction it:

1. serializes publication and graph writers with a per-plan advisory lock;
   every child or plan-root definition write also dirties the stored hash until
   the complete graph is canonicalized again;
2. locks and owner-checks the plan;
3. requires the exact expected graph hash and draft status;
4. rechecks graph bounds, ordering, active capabilities, and acyclicity with a
   bounded topological pass;
5. marks the objective version and plan published together.

Publishing the same plan and graph hash again is idempotent. A different hash,
owner, non-draft state, inactive capability, invalid ordering, or cyclic graph
is rejected. Once published, the existing V2 immutability guards prevent graph
changes.

## Deliberate exclusions

This slice does not create plans, select capabilities, evaluate policy, enqueue
steps, execute providers, re-plan, or expose objective progress UI. Those
remain later control-plane and execution-runtime slices.
