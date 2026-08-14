# 019 — Prove the V1 Journeys and Release Readiness

Status: Blocked  
Priority: Critical  
Depends on: 001 through 018

## Objective

Demonstrate that WebWidgets V1 works as a product under production-like
conditions. Close misleading test configuration, add end-to-end coverage for
the three required journeys, run a bounded staging pilot, and produce an
evidence-based release decision.

## Required preparation

- Audit every criterion in `docs/finalization/V1_ACCEPTANCE.md` and map it to
  automated evidence, pilot evidence, manual verification, or an unresolved
  blocker.
- Set numerical launch thresholds before the pilot for source sync success and
  lag, duplicate events/actions, briefing latency/cost/usefulness, candidate
  precision/dismissal, action success, automation success, and critical
  recovery time.
- Repair or remove broken npm test scripts and dead Playwright projects so the
  documented commands match real tests.
- Confirm CI checks are required on the release branch through repository
  settings; do not claim a workflow file alone enforces protection.

## Required E2E journeys

### Timeline and briefing

Connect/configure a fixture personal source and RSS source, ingest events,
show provenance and source health, generate a cited briefing, and handle one
failed source without blanking healthy data.

### Commitment to completed task

Ingest a credible dated commitment, create one candidate, edit/approve it,
create exactly one task, complete it, and display the verified outcome. Replay
the source/job/approval to prove idempotency.

### Basic automation

Configure a briefing or commitment template, run dry-run, enable it, execute
through the durable state machine, inspect history, pause it, and prove a
subsequent trigger cannot execute.

## Required pilot

- Run production-like staging ingestion and automation for seven consecutive
  days with a small explicit test cohort or controlled test accounts.
- Review daily source gaps, duplicates, model failures, misleading claims,
  incorrect candidates, action failures, costs, and security alerts.
- Do not use real private content in issue reports or evaluation fixtures.
- File and resolve launch-blocking findings; defer only limitations consistent
  with the V1 product definition.

## Required release artifacts

- Final acceptance matrix with links to evidence.
- Release notes describing supported sources, actions, automations, autonomy
  limits, beta surfaces, known limitations, and recovery/support paths.
- Updated `ROADMAP.md`, `ARCHITECTURE.md`, and relevant decision records.
- Deployment/migration checklist and rollback plan.
- A clear `Go`, `Conditional Go`, or `No Go` recommendation with blockers and
  accountable next actions.

## Acceptance criteria

- All three E2E journeys pass against production-like services.
- Seven-day pilot thresholds are met with no silent data loss or duplicate
  side effect.
- Every V1 acceptance criterion has evidence or is declared a release blocker.
- Suspended beta features remain excluded from V1 claims and defaults.
- No fake-success, unimplemented control, critical/high security issue, or
  undocumented required process remains in the V1 path.
- A human release owner approves the final decision; the implementing agent
  does not self-certify or merge its own release PR.
