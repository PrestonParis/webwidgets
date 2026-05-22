# 029 - ML: Accessibility Remediation Advisor

Status: Available
Assigned Agent: Unassigned
Stage: 2
Priority: Medium

## Objective

Build an accessibility remediation advisor for the Accessibility Center. It should classify audit findings, recommend fixes, and prioritize issues across dashboard widgets and feature pages.

## Context

- `features/accessibility/` contains preferences, assistive modes, audit findings, and remediation controls.
- Existing frontend audit data is deterministic and ready for real issue ingestion.
- This should complement, not replace, static a11y checks.

## Required Implementation

1. Add `ml_service/accessibility_advisor.py`.
   - Rule-based classifier for categories: `vision`, `motion`, `keyboard`, `cognitive`, `audio`.
   - Prioritize issues based on severity, affected surface, interaction frequency, and whether the surface is on the home dashboard.
   - Generate remediation steps in short imperative language.
2. Add schemas:
   - `AccessibilityIssueItem`
   - `AccessibilityRemediationRequest`
   - `AccessibilityRemediation`
   - `AccessibilityRemediationResponse`
3. Add endpoint `POST /advise-accessibility`.
4. Add Next proxy `app/api/ml/advise-accessibility/route.ts`.
5. Wire `features/accessibility/hooks/useAccessibilityCenter.ts` so the Generate Fixes action can fetch recommendations.

## Validation

- Keyboard-blocking issues outrank low-severity visual polish.
- Motion issues mention reduced-motion behavior.
- Empty issue lists return an empty plan, not an error.
- Accessibility Center still renders deterministic recommendations when ML is unavailable.

