# 030 - ML: Collaboration Handoff Risk Detector

Status: Available
Assigned Agent: Unassigned
Stage: 2
Priority: Medium

## Objective

Build a handoff risk detector for the Collaboration feature. It should identify blocked rooms, stale handoffs, unclear ownership, and risky permission states before they derail shared work.

## Context

- `features/collaboration/` contains shared workspaces, collaborators, handoffs, permissions, and activity stream.
- `app/collaboration/page.tsx` is the full page route.
- `features/collaboration/components/CollaborationWidget.tsx` is on the home dashboard.

## Required Implementation

1. Add `ml_service/collaboration_risk.py`.
   - Deterministic scoring for stale handoffs, blocked rooms, offline owners, high-priority due-today tasks, and permission templates with too few approvals.
   - Optional logistic model can be added later, but deterministic scoring is acceptable for v1.
2. Add schemas:
   - `CollaborationHandoffItem`
   - `CollaborationWorkspaceItem`
   - `CollaborationRiskRequest`
   - `CollaborationRiskItem`
   - `CollaborationRiskResponse`
3. Add endpoint `POST /detect-collaboration-risk`.
4. Add Next proxy `app/api/ml/detect-collaboration-risk/route.ts`.
5. Wire Collaboration page to show risk badges and recommended owner/action.

## Validation

- Critical due-today handoffs owned by offline users score high.
- Healthy live workspaces score low.
- Permission templates with automation role and zero approvals are flagged.
- Frontend falls back to existing deterministic handoff queue if ML is unavailable.

