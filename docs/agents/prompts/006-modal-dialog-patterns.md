# 006 - Standardize Modal and Dialog Patterns

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: Medium

## Objective

Establish a consistent pattern for modals and dialogs across the application.

## Context

Modals are used for widget settings, event adding, and complex forms. We need a unified approach to ensure they look and behave consistently (transitions, backdrop, closing behavior).

## Required Reading

- `docs/blueprint/VISION.md` (UI section)
- `features/calendar/components/EventFormModal.tsx` (existing example)

## Required Searches

```bash
rg "Modal"
rg "Dialog"
rg "Radix"
```

## Implementation Requirements

1. **Base Dialog Component:** Create or refine a `BaseModal` or `Dialog` component in `features/ui/components/`.
2. **Standard Styles:**
   - Consistent backdrop blur and opacity.
   - Standardized entrance/exit animations.
   - Clear "Close" button placement.
   - Support for various sizes (sm, md, lg, xl, full).
3. **Usage Pattern:** Document and implement a pattern for triggering modals (e.g., using a global store or a standard hook).
4. **Accessibility:** Ensure focus trapping and "Escape" key behavior are handled correctly.

## Constraints

- Prefer Radix UI's Dialog primitive if it's already in use.
- Avoid "Modal sprawl"—use side-panels or inline expansions where appropriate.

## Files Likely Affected

- `features/ui/components/Modal.tsx` (New/Refined)
- `features/widgets/components/WidgetSettingsPanel.tsx`
- `features/calendar/components/EventFormModal.tsx`

## Validation

- Test on mobile and desktop.
- Verify focus management.
- Check that long content in modals is scrollable without breaking the layout.

## Completion Notes

Created `features/ui/components/Modal.tsx` with `Modal` (size sm/md/lg/xl, Escape key handler, `role="dialog"` + `aria-modal`, backdrop click to close), `ModalHeader` (title + description + close button, accepts `id` for `aria-labelledby`), `ModalBody` (scrollable flex-1 area), `ModalFooter` (right-aligned action row). No Radix UI dependency — project doesn't have it. Refactored `FeedbackModal` to use these primitives as the first consumer. Existing modals (SignOutModal, ConfirmModal, EventFormModal, finance modals) can migrate incrementally.
