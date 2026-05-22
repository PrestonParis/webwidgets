# Widget Synthesis Architecture

Widget Synthesis turns user intent into previewable widget definitions. The system is intentionally registry-first:

- `engine/intentParser.ts` extracts domain, purpose, data needs, visualization needs, likely integrations, urgency, privacy sensitivity, and complexity.
- `engine/capabilityGraph.ts` models available data sources, components, transformations, actions, and layouts, including missing capability reasons.
- `engine/synthesisPlanner.ts` converts intent into an assembly plan with sources, fallbacks, transformations, components, layout, actions, permissions, preview strategy, buildability, and confidence.
- `widgetSearchSynthesis.ts` uses FlexSearch over blueprint-inspired templates plus the planner to generate non-explicit widget candidates.
- `preview/previewEngine.ts` generates safe sample previews and exposes schema/layout warnings before saving.

## Registries

Add new capabilities to the existing registries:

- Data sources: `dataSourceRegistry.ts`
- UI components: `componentRegistry.ts`
- Transformations: `transformationRegistry.ts`
- Actions: `actionRegistry.ts`

Each registry entry should describe data shape, permissions, preview support, missing setup, and compatibility. The synthesis planner depends on these descriptions rather than hardcoded provider assumptions.

## Custom Widgets

Custom widgets use schema-first contracts and safe API definitions. External APIs are represented by `CustomApiSourceConfig`, then converted into a synthesized data source with `customApiConfigToDataSource`.

Safety rules:

- No arbitrary JavaScript execution.
- Only HTTPS external API URLs.
- Internal hosts and metadata endpoints are blocked.
- Secret headers are not stored in widget state.
- Auth uses server-side `secretRef` placeholders.
- Sample payloads are size-limited.
- Methods are limited to `GET` and `POST` for this iteration.

## Future ML Hooks

The synthesis event schema captures search queries, selected/rejected widgets, generated drafts, missing capabilities, modifications, saves/deletes, and preview results. These events are designed for future recommendation training without changing the core widget definition shape.
