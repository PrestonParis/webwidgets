# V2 canonical objective and execution schema

**Status:** implementation contract for V2-006

**Decision basis:** ADR-027 and ADR-028

**Migrations:** `202609080001` through `202609080005`

## Scope

The V2 schema is an additive control and execution ledger. It represents
maturity levels 1 through 4 as data, not executable code. A published plan
names a versioned capability and stores normalized JSON input; it cannot store
scripts, expressions, SQL, or other executable payloads.

The model separates five concerns:

| Concern                                     | Canonical tables                                                                               |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Objective and immutable intent              | `objectives`, `objective_versions`                                                             |
| Immutable executable graph definition       | `objective_plans`, `objective_plan_steps`, `objective_step_dependencies`                       |
| Policy, exact approval, and resource limits | `objective_policy_decisions`, `objective_approvals`, `objective_budgets`                       |
| Durable execution                           | `objective_runs`, `objective_step_attempts`, `objective_step_results`                          |
| External effects and evidence               | `objective_external_effects`, `objective_verification_results`, `objective_execution_evidence` |

All tenant relationships use composite owner foreign keys. Every new table has
RLS. Authenticated clients can author only objective and draft-plan records;
policy, approval, budget, execution, effect, verification, and evidence rows
are readable by their owner but writable only through the privileged runtime.
The service role remains confined to server routes and workers.

## State and immutability rules

- Objective and plan transitions are checked by database triggers. Terminal
  objectives may only move to `archived`; published plans may only be
  superseded.
- Publishing freezes an objective version and the plan graph. Corrections
  create a new version or plan rather than rewriting history.
- An approval is valid only for the exact stored payload, hash, and version.
  Only one pending approval may exist for a step and payload version.
- Policy decisions, step results, verification results, and execution evidence
  are append-only. External-effect reservations permit only the explicit
  receipt, verification, uncertainty, and compensation transitions.
- Deletes required by account deletion or approved retention processing use a
  privileged transaction with `SET LOCAL app.v2_evidence_purge = 'on'`.
  Ordinary service-role writes do not bypass immutability.

The application must still use compare-and-swap updates for `state_version`
and `ownership_epoch`. Database transition checks are a fail-closed backstop,
not a substitute for lease and epoch predicates in the executor.

## V1 coexistence

V1 remains the owner of every existing job class until its ADR-027 ownership
epoch is explicitly advanced. These migrations do not backfill, reschedule,
or change any V1 row, trigger, queue, or route.

V2 provides nullable bridges to the established ledgers:

| V2 record                    | Optional V1 reference               | Purpose                                                                     |
| ---------------------------- | ----------------------------------- | --------------------------------------------------------------------------- |
| `objective_runs`             | `automation_runs`, `jobs`           | Correlate a V1-triggered or transitional run without duplicating V1 history |
| `objective_external_effects` | `action_requests`, `action_results` | Reuse the canonical V1 request/result receipt during a job-class migration  |

The references include `user_id`, so cross-tenant links fail at the database
boundary. A native V2 run may leave all V1 bridge columns null.

For each job class, deploy the Go executor dark, validate shared fixtures,
pause and reconcile V1 work, then atomically advance the owner and epoch.
Rollback advances a new epoch back to V1 after leases and ambiguous effects
are reconciled. Historical V2 rows remain; rollback never deletes evidence or
runs both owners simultaneously.

## Retention, deletion, and recovery

Objective records and minimized execution evidence default to the existing
365-day evidence baseline. Objective-local working memory is intentionally not
introduced here; ADR-028 requires a separate lifecycle with active-objective
scope plus 30 days.

Account deletion must pause objectives, block new claims, reconcile reserved or
ambiguous effects, revoke credentials, and then purge in an auditable
privileged transaction. Source deletion removes copied content while retaining
only the minimum allowed receipt/hash metadata. Partial deletion is retried
from durable purge state; setting the purge flag outside an approved retention
or account-deletion operation is prohibited.

Schema rollback is forward repair. Once V2 rows exist, do not drop these
tables to roll back an application release. Disable new V2 claims, reconcile
effects, deploy a compatible application, and add a corrective migration.

## Deployment order and validation

Apply the migrations in numeric order. Before enabling a V2 class:

1. run the schema and RLS pgTAP suite, including cross-tenant rejection;
2. deploy readers and writers that understand every pinned schema version;
3. deploy Go dark and verify it cannot claim without the matching epoch;
4. exercise approval payload equality, lease expiry, unknown-effect recovery,
   and evidence retention against production-shaped fixtures; and
5. perform the single-owner cutover only after the V2 evaluation thresholds
   are satisfied.
