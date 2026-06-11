# 031 - ML: Creative Canvas Understanding

Status: Available
Assigned Agent: Unassigned
Stage: 2
Priority: Medium

## Objective

Build an ML/data-processing endpoint that understands Creative Studio canvas layers and recommends exports, widget conversion, and layout cleanup.

## Context

- `features/creative/` contains canvas layers, tools, templates, and export targets.
- `app/creative/page.tsx` is the full page route.
- `features/creative/components/CreativeWidget.tsx` is on the home dashboard.

## Required Implementation

1. Add `ml_service/creative_canvas_analyzer.py`.
   - Analyze layer geometry, names, types, colors, visibility, and lock state.
   - Detect overlapping text, off-canvas objects, low-contrast text/background pairs, and export readiness.
   - Recommend target format: `png`, `svg`, `pdf`, or `widget`.
2. Add schemas:
   - `CreativeLayerItem`
   - `CreativeCanvasAnalyzeRequest`
   - `CreativeCanvasIssue`
   - `CreativeCanvasAnalyzeResponse`
3. Add endpoint `POST /analyze-creative-canvas`.
4. Add Next proxy `app/api/ml/analyze-creative-canvas/route.ts`.
5. Wire Creative Studio Export and Generate Widget actions to display analysis results before export.

## Validation

- Text layers over similar-color backgrounds are flagged.
- Hidden layers are ignored for export readiness.
- Canvas with all visible layers inside bounds returns `ready: true`.
- Creative Studio remains fully functional with local deterministic state when ML is unavailable.
