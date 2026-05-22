# 008 - Feedback System: Toasts and Alerts

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: Medium  

## Objective

Implement a global feedback system for toasts, inline alerts, and confirmation dialogs.

## Context

Users need immediate feedback after actions (e.g., "Settings saved", "Task deleted"). We need a non-intrusive but clear way to communicate success, warning, and error states.

## Required Reading

- `docs/blueprint/VISION.md` (Feedback patterns)

## Required Searches

```bash
rg "toast"
rg "alert"
rg "sonner"
rg "react-hot-toast"
```

## Implementation Requirements

1. **Toast System:** Implement or refine a global toast system (e.g., using `sonner` or `react-hot-toast`).
2. **Inline Alerts:** Create an `Alert` component for persistent messages within pages or widgets.
3. **Consistency:** Ensure colors and icons for success/warning/error match the overall design system.
4. **Action Feedback:** Automatically trigger toasts for common actions (Save, Delete, Update) if they aren't already.

## Constraints

- Toasts should be accessible (aria-live).
- Alerts should be dismissible if they aren't critical.

## Files Likely Affected

- `features/ui/components/Toast.tsx`
- `features/ui/components/Alert.tsx`
- `app/layout.tsx` (for toast provider)

## Validation

- Trigger various toast types from different parts of the app.
- Ensure toasts don't overlap critical UI elements on mobile.

## Completion Notes

Created `features/ui/hooks/useToast.ts` — global toast state hook with `success`, `error`, `info`, `warning` helpers, auto-dismiss timers. Created `features/ui/components/ToastProvider.tsx` — global context provider + `useToastContext()` hook. Renders toasts in fixed bottom-right stack with type-appropriate icons (CheckCircle2, XCircle, Info, AlertTriangle), colored borders, dismiss button, and `aria-live="polite"`. Wired into `app/providers.tsx` wrapping the entire app.
