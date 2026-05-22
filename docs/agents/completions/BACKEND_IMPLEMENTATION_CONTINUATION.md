# Backend / Smart Layer Continuation

## Existing Functionality Audited

- Existing API routes live under `app/api/*`, including Gmail, calendar, health, metrics, search, currency, and form-filler routes.
- Existing Python ML service already supports real internal model artifacts:
  - `ml_service/model_registry.py` for versioned model loading.
  - `ml_service/drift_monitor.py` for drift monitoring.
  - `ml_service/main.py` for email classification, widget suggestions, and action extraction endpoints.
  - Tests exist in `ml_service/tests`.
- Existing email intelligence already has a hybrid chain:
  - deterministic rules in `features/inbox/lib/rules.ts`
  - internal ML service via `features/inbox/lib/mlService.ts`
  - optional Anthropic fallback in `features/inbox/lib/modelRouter.ts`
- Existing platform scaffolds from the prior pass include onboarding persistence, widget registry, integrations, activity, automation, finance, knowledge, import/export, personalization, and consent foundations.

## Extended / Created

- Added centralized backend service registry:
  - `features/backend/registry/backendServiceRegistry.ts`
  - `features/backend/services/requestUser.ts`
- Added Smart Layer / intelligence architecture:
  - provider abstractions for internal ML, deterministic rules, embeddings/local future providers, and optional external LLM providers
  - fallback/retry/confidence/audit/cost/rate-limit model types
  - internal ML provider that calls the existing Python ML service when `ML_SERVICE_URL` is configured
  - deterministic rule provider scaffold
  - external provider registry for OpenAI, Anthropic, Gemini, and local LLM without fake inference
  - smart context builder and user recommendation service
  - scenario and replay testing foundations
- Added durable job foundation:
  - job/job step/job artifact/log types
  - job service for create/list/read/cancel
  - runner registry boundary and retry helper
- Added widget-based action backend:
  - central action definitions
  - approval and consent-aware action request model
  - safe action execution boundary
  - audit event write on accepted actions
- Extended automation backend:
  - backend trigger/run types
  - evaluator helpers
  - server-side list and run logging boundaries
- Added audit backend:
  - `audit_events` model/service
- Extended consent/integration/import/finance/knowledge services with server-side boundaries.
- Added import pipeline preview/mapping validation boundary.
- Added finance aggregation helpers and knowledge research job boundary.
- Added safe developer backend gate.
- Added thin API routes:
  - `/api/smart/recommendations`
  - `/api/jobs`
  - `/api/jobs/[id]`
  - `/api/jobs/[id]/cancel`
  - `/api/actions/execute`
  - `/api/automations`
  - `/api/activity`
  - `/api/consent`
  - `/api/integrations`
  - `/api/imports`
  - `/api/finance/accounts`
  - `/api/knowledge/items`
- Added migration:
  - `supabase/migrations/20260518000003_backend_foundation.sql`

## Intentionally Scaffolded

- External LLM providers are registered but do not execute fake inference.
- Developer system operations are gated behind `WEBWIDGETS_DEV_TOOLS=enabled`.
- Automation execution defaults to approval boundaries and does not perform dangerous autonomous side effects.
- Import/export parsing, embeddings/vector retrieval, expensive background queues, and provider SDK calls remain clean extension points.
- Generated Supabase TypeScript types were not regenerated in this environment; current services use typed boundaries and the existing untyped Supabase escape hatch where schema generation has not caught up.

## Checks Run

- `npm run check` passes.
- Remaining advisory warnings are pre-existing tracking size warnings:
  - `features/tracking/components/TrackingPage.tsx` is 101 lines.
  - `features/tracking/components/QuickEntryForm/CustomFields.tsx` is 103 lines.
- ML service tests attempted:
  - `ml_service/venv/bin/python -m pytest ml_service/tests` failed because the venv does not have `pytest`.
  - `python3 -m pytest ml_service/tests` failed during collection because system Python does not have `fastapi`.

## Follow-Up Needed

- Install ML service dev test dependencies in `ml_service/venv` and rerun `ml_service/venv/bin/python -m pytest ml_service/tests`.
- Regenerate Supabase types after applying migrations.
- Add route tests for the new backend API boundaries.
- Wire job records into long-running email/import/tracking/finance workflows.
- Add real provider implementations for configured LLMs through the provider interface.
- Add caching layer for inference requests.
- Add audit events for consent revocation and automation disabling.
- Split the two tracking advisory files.

## Exact Next Codex Prompt

```text
Continue from BACKEND_IMPLEMENTATION_CONTINUATION.md. Install or configure the ML service test dependencies if available, rerun the Python ML tests, then add unit tests for the new Smart Layer provider fallback, job service, action approval boundary, consent checks, and scenario replay harness. Regenerate Supabase types if possible after migrations. Keep routes thin, no fake intelligence, no direct Supabase calls in components, no any, and run npm run check before finishing.
```
