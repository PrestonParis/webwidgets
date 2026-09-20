# V2 deterministic policy evaluation

**Policy version:** `v2.policy.1`  
**Implementation:** `apps/web/lib/automationPolicy`

## Boundary

The evaluator is a pure Next.js control-plane boundary. It validates one
proposed capability call and returns a versioned `policyDecisionSchema` value.
It does not persist the decision, create an approval, enqueue work, call a
provider, or advance objective state.

Callers must construct consent, connection, delegation, objective, allowlist, and budget
snapshots from authenticated canonical records. Request bodies, source content,
working memory, planner output, and model output cannot supply or modify those
authority inputs. The evaluator accepts the proposed capability name, version,
and payload, but obtains risk and execution metadata only from the immutable
production capability registry. It sets the policy version itself.

## Fail-closed gates

A call is denied when any of these conditions holds:

- the objective is not submitted or active;
- the capability version is absent from the registry or the objective's exact
  capability allowlist;
- the payload fails the registered input schema;
- consent is revoked, stale, or does not include the exact capability version;
- the connection snapshot is stale or lacks the required provider, account,
  and normalized scope;
- the budget is closed, exhausted, or cannot cover the next attempt; or
- the registered risk class is prohibited.

Every decision binds the owner, objective, plan, step, budget, immutable
capability version, normalized payload and hash, registry-owned risk class,
canonical hashes computed from the normalized consent, connection, budget,
delegation, and allowlist snapshots, policy version, evaluation time, and
expiry. Denials expose stable reason codes
rather than rejected input details or provider diagnostics.
The evaluator creates timestamps from its trusted clock and rejects
caller-supplied timestamps. Decision validity is capped at five minutes;
execution must still revalidate
current authority immediately before dispatch.

## Risk rules

| Registered risk  | Default decision | Delegation behavior                                   |
| ---------------- | ---------------- | ----------------------------------------------------- |
| Read             | Allow            | Not required                                          |
| Draft            | Allow            | Not required                                          |
| Reversible write | Require approval | Exact current capability-version delegation may allow |
| External         | Require approval | Exact current capability-version delegation may allow |
| Sensitive        | Require approval | Cannot be bypassed by delegation                      |
| Destructive      | Require approval | Cannot be bypassed by delegation                      |
| Prohibited       | Deny             | Cannot be bypassed                                    |

Provider scopes establish technical availability, not user authorization.
Prior approval for another payload or capability version is not delegation.
Stale and disabled delegation snapshots never authorize execution.

## Next boundary

V2-009 intentionally stops before persistence. The next control-plane slice
must read the authority snapshots server-side, call this evaluator, append the
decision through a narrow database operation, and create an exact-payload
approval only for `require_approval`. Go may later dispatch only from a current
persisted allow decision or a current exact approval; it must revalidate
applicability immediately before execution as required by ADR-027.
