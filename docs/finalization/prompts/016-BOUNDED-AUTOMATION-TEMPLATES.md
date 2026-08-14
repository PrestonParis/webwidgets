# 016 — Ship the Bounded V1 Automation Templates

Status: Blocked  
Priority: Critical  
Depends on: 011 and 015

## Objective

Deliver useful automation on top of real actions and the persisted state
machine through four understandable templates, not an unrestricted builder.

## Required templates

### Commitment capture

Trigger on a new eligible commitment candidate. Default to dry-run or
approval-required. Create a task only through the unified task action.

### Daily briefing

Run at a user-selected local time and timezone. Generate one briefing for the
covered window, disclose source failures, and avoid duplicate runs around
restart and daylight-saving changes.

### Calendar preparation

From an approved eligible task/candidate with a concrete time window, prepare
or create a calendar event under the configured approval mode. Never invent a
time when the input is ambiguous.

### Stale-task review

On a bounded schedule, surface overdue or inactive tasks for review. Do not
delete, complete, or silently reschedule tasks.

## Required implementation

- Define typed immutable template versions, supported inputs, required
  integrations/consents, default approval, and safe rate/cost limits.
- Add configuration UI for enable/disable, schedule/timezone where relevant,
  dry-run, approval mode, and last-run status.
- Provide a preview explaining trigger, conditions, action, evidence, and what
  the automation is not allowed to do.
- Route every execution through canonical automation and action records.
- Make partial source/model/provider failure visible in run history.
- Prevent repeated events, schedule replay, or model rerun from duplicating
  tasks, briefings, or calendar events.
- Add template-specific unit, integration, and time-zone/DST tests.

## Acceptance criteria

- All four templates can be enabled, disabled, dry-run, inspected, and paused.
- Commitment capture creates at most one task per candidate.
- Daily briefing creates at most one briefing per configured window.
- Calendar preparation refuses ambiguous time data.
- Stale-task review changes no task state without a separate approved action.
- Failures are understandable from the Automation Center without server logs.
