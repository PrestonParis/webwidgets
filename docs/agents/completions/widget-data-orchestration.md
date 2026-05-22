# Widget Data Orchestration

WebWidgets is moving dashboard data loading toward screen snapshots instead of each widget independently choosing its own fetch graph.

## Flow

```txt
Client widgets/pages
  -> hooks/UI adapters
  -> snapshot route handlers
  -> screen orchestrators
  -> widget manifest + data resolver registry
  -> domain services
  -> connectors, DB, external APIs, ML service
```

## New Pieces

- `features/widgets/registry/widgetManifest.ts` declares widget IDs, features, data needs, refresh policy, and fallback mode.
- `features/widgets/registry/widgetDataRegistry.ts` maps data need keys to resolvers.
- `features/widgets/server/resolveWidgetData.ts` deduplicates data needs, runs resolvers in parallel, validates outputs with Zod, and isolates failures.
- `features/dashboard/server/dashboardOrchestrator.ts` maps active dashboard widgets to normalized `WidgetSnapshot` payloads.
- `app/api/dashboard/snapshot/route.ts` is intentionally thin: parse request, attach request/user context, call `getDashboardSnapshot`, return JSON.

## Feature Pattern

Feature-specific domain logic should live under `features/(feature)/server/` when it is server-only orchestration:

- `features/finance/server/financeService.ts`
- `features/finance/server/financeResolvers.ts`
- `features/currency/server/currencyService.ts`
- `features/currency/server/currencyResolvers.ts`
- `features/datahealth/server/dataHealthService.ts`
- `features/datahealth/server/dataHealthResolvers.ts`

Low-level external calls belong in `lib/connectors/*`. Existing `features/*/api` folders should remain as thin compatibility wrappers where needed.

## Client Guidance

Dashboard widgets should prefer `useWidgetSnapshot(widgetId)` for load-time data. Existing hooks can remain for mutations, interaction-specific refreshes, or compatibility fallback, but new widgets should not fan out many independent dashboard-load fetches.

Resolver failures should produce per-widget errors, not page-level crashes. Do not expose raw exception messages or stack traces to clients. Use Sentry context tags such as `screen`, `resolverKey`, and safe `userId` when available.
