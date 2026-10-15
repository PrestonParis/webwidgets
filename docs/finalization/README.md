# WebWidgets V1 Finalization

This directory is the working completion plan for WebWidgets V1. It replaces
the breadth-first sequence in `docs/blueprint/VISION.md` for finalization work.
The blueprint remains useful as a long-term product inventory, but it is not
the V1 execution order.

## V1 outcome

WebWidgets V1 is a personal timeline and action workspace that:

1. collects user-authorized signals from a small set of sources;
2. turns those signals into a normalized, inspectable timeline;
3. identifies commitments, deadlines, changes, and useful next steps;
4. proposes basic actions with evidence and confidence;
5. completes approved task and calendar actions safely; and
6. records what happened so the user can review and correct the system.

V1 is complete when this loop works reliably. It is not defined by the number
of widgets in the repository.

## Documents

- [V1 scope and freeze](V1_SCOPE.md) defines what ships, what enters beta, and
  what is explicitly deferred.
- [Target product loop](TARGET_PRODUCT_LOOP.md) defines the V1 data,
  intelligence, approval, and action flow.
- [Delivery plan](DELIVERY_PLAN.md) breaks the work into ordered workstreams
  and release gates.
- [V1 acceptance criteria](V1_ACCEPTANCE.md) defines the objective finish line.
- [Decision log](DECISIONS.md) records finalization decisions that should not
  be silently reversed during implementation.
- [Implementation prompts](prompts/README.md) turns the delivery plan into an
  ordered queue of bounded, agent-ready tasks.
- [V1 operations runbook](V1_OPERATIONS_RUNBOOK.md) defines telemetry,
  thresholds, deployment, rollback, incident response, and recovery.
- [Launch thresholds](V1_LAUNCH_THRESHOLDS.md),
  [acceptance matrix](V1_RELEASE_ACCEPTANCE_MATRIX.md),
  [pilot log](V1_PILOT_LOG.md), [release notes](V1_RELEASE_NOTES.md), and the
  [release checklist](V1_RELEASE_CHECKLIST.md) hold Prompt 19 evidence and the
  final human decision.

## Planning rules

- Freeze feature breadth until V1 acceptance criteria pass.
- Finish vertical user journeys instead of isolated components.
- A UI shell, registry entry, model script, or unstarted worker does not count
  as a working capability.
- Placeholder handlers must never report successful completion.
- Every automated conclusion and action must be attributable to source data.
- Default to suggestion and approval. Earn greater autonomy from observed
  reliability rather than enabling it by default.
- Security, schema tracking, worker durability, and observability are parts of
  the product loop, not post-product cleanup.

## Canonical relationship

During V1 finalization, this directory controls scope and sequencing. The
root `ROADMAP.md` remains the canonical repository-wide maturity inventory.
When implementation changes a maturity rating, both documents should remain
consistent.
