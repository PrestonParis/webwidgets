# V2 policy persistence and exact approvals

**Slice:** V2-010
**Issue:** #40

## Boundary

`POST /api/objectives/{objectiveId}/policy-decisions` accepts only the contract
version plus an owned plan ID and step ID. The server loads the objective,
published plan, immutable step input, objective-version allowlist, current
budget, automation consent, active capability version, and exact provider
account scopes. Caller input cannot supply risk, policy, consent, connection,
delegation, budget, payload, hashes, decision timestamps, or a decision.

Delegation remains disabled in this slice. The route evaluates through the
V2-009 deterministic policy engine and calls the service-role-only
`persist_v2_policy_decision` database function.

## Atomic persistence

The database function locks and revalidates the exact owner/objective/plan/step
and budget binding, published/runnable state, immutable payload and risk, policy
version, and five-minute decision lifetime. It then performs one transaction:

- reuse a current identical decision and pending approval when possible;
- revoke any stale pending approval for the step;
- append the immutable policy decision; and
- create one pending version-1 approval only for `require_approval`.

The browser roles cannot call this function. Reversible-write and external
decisions cannot be persisted as `allow` until a later slice defines and tests
delegation policy. V2-010 does not enqueue work, execute a capability, publish a
plan, or advance objective state.
