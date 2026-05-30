# 007 - Form Primitives and Validation Patterns

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: High

## Objective

Build a reusable set of form primitives (Input, Select, Checkbox, etc.) and establish a standard validation pattern.

## Context

Forms are everywhere: settings, onboarding, logging health data, etc. We need consistent styling and error handling for all inputs.

## Required Reading

- `docs/blueprint/VISION.md` (Form patterns)
- `features/onboarding/` (existing complex forms)

## Required Searches

```bash
rg "react-hook-form"
rg "zod"
rg "Input" features/ui
```

## Implementation Requirements

1. **Input Primitives:** Standardize `TextInput`, `NumberInput`, `Select`, `Checkbox`, `Switch`, and `DatePicker`.
2. **Validation:** Standardize on `react-hook-form` and `zod` for validation.
3. **Error Handling:** Ensure inline error messages are consistent and accessible.
4. **Field Layouts:** Create a `FormField` wrapper that handles labels, hints, and error states.

## Constraints

- Use Tailwind CSS for styling.
- Ensure all form elements are keyboard-navigable.

## Files Likely Affected

- `features/ui/components/forms/` (New directory)
- `features/settings/`
- `features/onboarding/`

## Validation

- Build a sample "Profile Settings" form using the new primitives.
- Verify that validation triggers correctly and errors are clear.

## Completion Notes

Created `features/ui/components/FormField.tsx` with `FormField` (label + hint + error message + required marker), `TextInput`, `TextArea`, `SelectInput`. Consistent focus ring, dark mode, disabled state, and inline error via `role="alert"`. All typed via native HTML element interfaces.
