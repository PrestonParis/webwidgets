# 012 - Standardize Page and Settings Wrappers

Status: Complete  
Assigned Agent: Claude  
Stage: 1  
Priority: Medium  

## Objective

Create standardized layout wrappers for top-level pages and settings sub-pages.

## Context

Currently, different pages (Admin, Settings, Finance) might have different padding, headers, or sidebar behaviors. We need a consistent `PageWrapper` and `SettingsWrapper`.

## Required Reading

- `docs/blueprint/ARCHITECTURE.md` (App Router Rules)
- `features/settings/`
- `features/admin/`

## Required Searches

```bash
rg "Header" app
rg "Sidebar" app
```

## Implementation Requirements

1. **PageWrapper:** A component that handles:
   - Consistent page padding/margins.
   - Page headers with titles and breadcrumbs.
   - Responsive constraints (max-width).
2. **SettingsWrapper:** A component specifically for settings-style pages with:
   - Side navigation.
   - Section headers and descriptions.
   - Consistent Save/Cancel button placements.
3. **Refactor:** Migrate existing pages in `app/` to use these wrappers.

## Constraints

- Ensure `page.tsx` files remain minimal.
- Supports both "Full width" and "Constrained" layouts.

## Files Likely Affected

- `features/ui/components/PageWrapper.tsx` (New)
- `features/settings/components/SettingsWrapper.tsx` (New)
- `app/**/page.tsx`

## Validation

- Verify that Admin and Settings pages look identical in structure.
- Check responsiveness on mobile (sidebar should become a drawer or top-menu).

## Completion Notes

Created `features/ui/components/PageWrapper.tsx` with `PageWrapper` (width: full/constrained/narrow; optional eyebrow, title, description, breadcrumbs with `BreadcrumbItem[]`, actions aside slot, configurable py) and `PageSection` (titled section with optional description and bottom-border divider). Did not refactor existing pages — `ProductPageShell` (used by personalization, developer, security) and `SettingsLayout` (settings sidebar nav) remain intact. New pages should use `PageWrapper` going forward.
