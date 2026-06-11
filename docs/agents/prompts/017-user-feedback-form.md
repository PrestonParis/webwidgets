# 017 - User Feedback Form (Bonus Feature)

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: Medium

## Objective

Implement a concise user feedback form accessible from the product UI.

## Context

As part of Stage 1, we want to gather early feedback from users about their experience, bugs, and desired features.

## Required Reading

- `docs/agents/workflow/GEMINI.md` (Bonus Stage-One Feature)

## Required Searches

```bash
rg "feedback"
```

## Implementation Requirements

1. **Trigger:** Add a "Feedback" button to the `Header` or `Footer`.
2. **Form UI:** A clean, low-friction form (modal or side-panel) asking:
   - What they did.
   - What they wanted to do.
   - What they want to see.
   - What confused them.
   - What broke/bugs found.
3. **Storage:** Save the feedback to a new `user_feedback` table in Supabase.
4. **Confirmation:** Show a clear success toast after submission.

## Constraints

- Keep it extremely simple and fast to fill out.
- This is for product feedback, not technical support.

## Files Likely Affected

- `features/feedback/` (New feature folder)
- `features/ui/components/Header.tsx`
- `supabase/migrations/` (for the new table)

## Validation

- Submit a test feedback entry and verify it appears in the database.
- Check the form's responsiveness on mobile.

## Completion Notes

Created `features/feedback/components/FeedbackModal.tsx` — 5 optional TextArea fields (what I did, wanted, want to see, confused me, bugs found), scrollable body, disabled submit until at least one field has content, shows success toast on submit via `useToastContext`. Created `app/api/feedback/route.ts` POST endpoint that writes to Supabase. Added `supabase/migrations/20260520000001_user_feedback.sql` with RLS: users insert/read their own rows, admins read all. Added `MessageSquare` icon button to `features/ui/components/Header.tsx` that opens the modal.
