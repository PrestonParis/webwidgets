# 015 — Persist the V1 Automation State Machine

Status: Blocked  
Priority: Critical  
Depends on: 004, 013, and 014

## Objective

Replace empty Automation Center services with a durable, user-scoped state
machine for configuration, trigger evaluation, approval, execution, outcome,
pause, and failure recovery.

## Required design

Use canonical action and outcome records. An automation run coordinates typed
actions; it must not duplicate the action engine’s provider logic or maintain
a competing audit history.

Pending Prompt 002 approval, automation schedules run through the single V1
worker, configurations/runs own orchestration state, and every provider result
remains owned by the referenced `action_request`/`action_result` lifecycle.

Required states should cover at least:

- configuration: draft, dry-run, enabled, paused, disabled;
- run: triggered, evaluating, skipped, awaiting-approval, queued, running,
  completed, partially-failed, failed, dead-lettered, cancelled; and
- approval: pending, approved, denied, expired, invalidated.

## Required implementation

- Implement persisted create, read, update, enable/disable, pause, delete or
  archive, run history, pending approval, approve, reject, and suggestion
  dismissal behavior behind authenticated services/routes.
- Validate typed trigger, condition, action, schedule, consent, required
  integration, approval mode, rate limit, and cost budget.
- Bind approvals to an immutable run/action payload version.
- Evaluate deterministic policy outside model output.
- Add per-user pause-all and ensure workers check it immediately before
  state-changing execution.
- Implement dry-run that records what would happen without invoking actions.
- Use durable scheduling from the selected worker runtime and prevent
  duplicate schedules after restart or configuration updates.
- Add retries and dead-letter state without replaying already completed
  actions.
- Replace temporary IDs, empty arrays, no-op toggles, and `Not implemented`
  rejections in Automation Center service paths.
- Add integration tests for every state transition, invalid transition,
  duplicate trigger, expired approval, pause race, schedule restart, partial
  failure, retry, and two-user isolation.

## Non-goals

- Do not build a general visual workflow language.
- Do not add arbitrary code execution or model-generated conditions.
- Do not implement the V1 templates in this prompt beyond one fixture needed
  to prove the state machine.

## Acceptance criteria

- Automation configurations and runs survive process restart.
- Invalid or stale transitions are rejected.
- Dry-run invokes no provider actions.
- Pause-all prevents new execution even for previously queued runs.
- Run history truthfully reflects action outcomes and failures.
- The Automation Center contains no fake persisted behavior on V1 paths.
