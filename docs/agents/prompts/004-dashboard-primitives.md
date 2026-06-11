# 004 - Dashboard Grid and Canvas Primitives

Status: Complete  
Assigned Agent: Unassigned  
Stage: 1  
Priority: High

## Objective

Refine the core dashboard layout engine to support both "Free Movement" and "Grid Snapping" as described in the vision.

## Context

The dashboard is the "Board" in "Stage 1: Board Development". We need the primitives for movement, snapping, and alignment to be rock solid.

## Required Reading

- `docs/blueprint/VISION.md` (Mobility section)
- `features/dashboard/components/DashboardGrid.tsx` (or equivalent)

## Required Searches

```bash
rg "react-grid-layout"
rg "dnd-kit"
rg "layout" features/dashboard
```

## Implementation Requirements

1. **Snap Rules:** Implement/Refine "Edge magnetism" and "Smart alignment guides".
2. **Pinning:** Support "Viewport pinned", "Canvas pinned", and "Anchor pinned" modes.
3. **Scenes:** Ensure the layout engine can quickly switch between "Scenes" (workspace states).
4. **Performance:** Ensure dragging multiple widgets remains performant.

## Constraints

- Reuse existing DND libraries if possible (check `package.json`).
- Ensure the "Free Movement" mode allows overlap as per the vision.

## Files Likely Affected

- `features/dashboard/components/`
- `features/platform/lib/platformPersistence.ts`
- `types/dashboard.ts`

## Validation

- Test complex layouts with 10+ widgets.
- Verify pinning survives page refresh.
- Test "Scene" switching speed.

## Completion Notes

### Snap Rules

- `computeSnap` in `useFreeCanvasComputed.ts` now uses actual widget sizes from the `sizes` map instead of hardcoded `WIDGET_W`/`WIDGET_APPROX_H` constants. Both own-widget size and other-widget sizes are accurate after resize operations.
- Added right-edge-to-right-edge and bottom-edge-to-bottom-edge snap cases (4 X snap axes, 4 Y snap axes total per widget pair).
- Visual guide lines already rendered as blue 1px divs in `FreeCanvas.tsx`.

### Pinning

- Separated `viewport` pin mode from `canvas`/`anchor` pin modes in `FreeLayer`.
- `isViewportPinned = true` → renders widget with `position: fixed` so it stays in viewport during page scroll. Styled with emerald ring to distinguish from canvas-pinned.
- `isCanvasPinned = true` → `canvas` or `anchor` modes; position locked (pointer events blocked on drag).

### Performance

- `useFreeCanvasDrag` now throttles `pointermove` with `requestAnimationFrame`. Pending move events are collapsed so each display frame processes at most one position update. Pending rAF cancelled on `pointerup`.

### Scenes

- Scene save/load/delete/rename was already fully implemented in `useScenes.ts` + `SceneSwitcher.tsx`. Scenes persist to `localStorage` under `dashboard-scenes`. Settings snapshot is stored but not captured (future work for per-scene widget settings).
