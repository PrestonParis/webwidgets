# 014 - Mobile-First Responsiveness Audit

Status: Available  
Assigned Agent: Unassigned  
Stage: 1  
Priority: High

## Objective

Audit and fix responsiveness issues across the entire application, ensuring a "Mobile-First" experience.

## Context

WebWidgets is intended to be used on the go. While the dashboard is complex, it must degrade gracefully on mobile devices.

## Required Reading

- `docs/blueprint/VISION.md` (UI Philosophy)

## Required Searches

```bash
rg "hidden md:block"
rg "flex-col md:flex-row"
```

## Implementation Requirements

1. **Dashboard Mobile View:** Ensure the dashboard grid collapses to a single column or a usable horizontal scroll on mobile.
2. **Widget Adjustments:** Ensure all 28+ widgets are usable on small screens—text should be readable, buttons should be tappable.
3. **Navigation:** Ensure the main navigation and settings are easily accessible via a "hamburger" menu or bottom bar on mobile.
4. **Touch Targets:** Audit all interactive elements to ensure they meet the minimum 44x44px touch target size.

## Constraints

- Use Tailwind's responsive prefixes (`sm:`, `md:`, `lg:`) correctly.
- Avoid "Desktop-only" features unless absolutely necessary (and then provide a mobile fallback).

## Files Likely Affected

- `features/dashboard/components/`
- `features/ui/components/Header.tsx`
- All widget implementation files.

## Validation

- Test using Chrome DevTools mobile emulation for iPhone SE, iPhone 12, and iPad.
- Verify no horizontal scrollbars on mobile.

## Completion Notes
