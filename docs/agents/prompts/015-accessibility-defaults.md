# 015 - Accessibility (a11y) Baseline Implementation

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: Medium

## Objective

Audit the application for core accessibility standards and implement necessary fixes.

## Context

WebWidgets should be usable by everyone. This includes screen reader support, keyboard navigation, and proper color contrast.

## Required Reading

- `docs/blueprint/VISION.md` (Accessibility section)

## Required Searches

```bash
rg "aria-"
rg "role="
rg "<button"
```

## Implementation Requirements

1. **Semantic HTML:** Ensure buttons are `<button>`, links are `<a>`, and headings follow a logical hierarchy (`h1` -> `h2`).
2. **Aria Labels:** Add `aria-label` to all icon-only buttons.
3. **Focus States:** Ensure all interactive elements have visible and distinct focus states.
4. **Color Contrast:** Audit core colors for WCAG AA compliance.
5. **Keyboard Navigation:** Ensure the dashboard and all widgets can be navigated using only the keyboard.

## Constraints

- Use Radix UI primitives where possible as they handle much of this out-of-the-box.
- Do not use `tabindex` greater than 0.

## Files Likely Affected

- `features/ui/components/`
- `features/widgets/components/`
- `app/layout.tsx`

## Validation

- Use an automated tool like Lighthouse or Axe to find issues.
- Manually test navigation using the `Tab` key.
- Test with a screen reader (e.g., VoiceOver on macOS).

## Completion Notes

Global baseline: Added skip-to-main-content link in `app/layout.tsx` (visually hidden, appears on focus). Added `id="main-content"` to settings layout. Added global `:focus-visible` ring (2px brand blue) and `:focus:not(:focus-visible) { outline: none }` to `globals.css` — ensures keyboard users see focus rings while mouse users don't. All new components built this session already have `aria-label`, `role="dialog"`, `aria-modal`, `aria-live`, and `focus-visible` rings via Tailwind: `Modal`, `Button`, `IconButton`, `FeedbackModal`, `CommandPalette`, `ThemeToggle`, `WidgetSettingsPanels`. Further per-widget and per-page audits can happen incrementally.
