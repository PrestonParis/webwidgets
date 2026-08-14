# 017 — Integrate the V1 Command Center

Status: Blocked  
Priority: Critical  
Depends on: 009, 011, 013, 014, 015, and 016

## Objective

Make the primary signed-in experience a coherent decision and completion
surface rather than a collection of unrelated widgets. Preserve manual widget
access, but foreground the V1 loop.

## Required user questions

The primary surface must answer, using real data:

- What changed since I last checked?
- What matters now?
- What needs my approval?
- What should I do next?
- What did WebWidgets complete?
- What failed or needs reconnection?

## Required investigation

- Inspect existing dashboard, command-center, activity, insight-card,
  automation, onboarding, and widget-synthesis surfaces before creating new
  UI.
- Reuse established cards, shells, dialogs, loading states, and responsive
  patterns.
- Identify high-churn shared files and split work if the prompt would require
  broad changes to dashboard fan-in points.

## Required implementation

- Compose timeline changes, current briefing, candidate actions, pending
  approvals, due/active tasks, recent verified outcomes, automation health,
  and source failures into one prioritized screen.
- Keep sections independently resilient so one failed source or service does
  not blank the entire command center.
- Provide direct paths to inspect evidence, edit/approve/dismiss candidates,
  complete tasks, review runs, pause automation, and reconnect sources.
- Track last-seen state without hiding unresolved important items.
- Preserve existing dashboard layouts and offer manual widgets as a secondary
  workspace rather than deleting customization.
- Remove or disable dead controls and fake data in the V1 path.
- Exclude suspended beta features from the default command center.
- Implement accessible focus management, semantic headings, keyboard actions,
  screen-reader labels, responsive layouts, dark mode, and reduced motion.
- Add focused component and integration tests for partial failures, empty/new
  user, pending approval, successful outcome, and stale source states.

## Acceptance criteria

- A new user can understand the next setup step from the empty state.
- A configured user can complete the commitment-to-task journey from the
  primary surface.
- Pending approvals, completed work, and failures are not hidden in separate
  developer/admin pages.
- Partial failure preserves usable sections and clearly identifies stale data.
- The page contains no demo fixtures or unimplemented controls in production.
- Existing user layouts and beta-feature data are preserved.
