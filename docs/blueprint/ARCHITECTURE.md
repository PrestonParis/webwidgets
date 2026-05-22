# WebWidgets Architecture

## Overview

WebWidgets is a Next.js App Router application with a Python FastAPI ML sidecar. The two services are deployed independently — Next.js to Vercel, ML service to a separate Vercel Python runtime. They communicate over HTTP via `ML_SERVICE_URL`.

**Codebase size (May 2026):** 1,295 files · 79,892 LOC · 70,686 code lines
- TypeScript: 696 files · 39,706 LOC
- TypeScript JSX: 518 files · 34,577 LOC
- Python: 16 files · 2,705 LOC
- SQL migrations: 64 files · 2,179 LOC

---

## Service Topology

```
Browser
  │
  ├── Next.js (Vercel)
  │     ├── App Router (RSC + Client Components)
  │     ├── API Routes (/app/api/**)
  │     │     ├── Gmail/Calendar (Google OAuth, googleapis)
  │     │     ├── Microsoft Graph (Outlook/OneDrive)
  │     │     ├── Finance (Plaid, Finnhub, Alpha Vantage)
  │     │     ├── Uploads (AWS S3, Google Drive)
  │     │     ├── Billing (Stripe webhooks + checkout)
  │     │     ├── Reading (scripture.api.bible proxy, S3 presigned)
  │     │     ├── News (RSS, NewsAPI adapters)
  │     │     └── ML proxy (forwards to ML service)
  │     ├── Supabase client (RLS, real-time)
  │     └── Observability (Sentry, PostHog analytics)
  │
  ├── ML Service (FastAPI, Vercel Python runtime)
  │     ├── POST /classify        → email label classification
  │     ├── POST /suggest         → widget suggestions from intent
  │     └── POST /extract-actions → email action extraction (7 classes)
  │
  ├── n8n (workflow automation, webhook triggers)
  │
  └── Supabase (database + auth + real-time)
```

---

## Frontend Structure

```
app/                    Next.js App Router pages and API routes
features/               Feature-scoped modules (50+ features)
  ├── actions/          Action engine — extract, queue, execute email/calendar actions
  ├── activity/         Activity feed widget
  ├── admin/            Admin panel (users, flags, audit, metrics, ML, jobs)
  ├── analytics/        PostHog event tracking
  ├── audit/            Audit log service
  ├── auth/             Supabase Auth, Google OAuth, sign-in form
  ├── automation/       Automation evaluator + registry
  ├── backend/          Shared request utilities (requestUser, service registry)
  ├── billing/          Stripe plans, checkout, PricingCard, BillingCard
  ├── calendar/         Google Calendar integration (events, EventFormModal)
  ├── chatbot/          Multi-model AI chat (Claude, GPT-4o, Gemini)
  ├── chess/            Games library, analysis board, studies, move trainer
  ├── context/          Context graph — knowledge nodes, AI memory, permissions
  ├── convert/          Unit + currency converter widget
  ├── countdown/        Event countdown widget
  ├── currency/         Exchange rate widget (Open Exchange Rates)
  ├── dashboard/        Widget grid, free canvas, drag-and-drop, scenes, folders
  ├── datahealth/       System health widget (Supabase, ML, Gmail, Calendar)
  ├── developer/        Developer tools page
  ├── finance/          Net worth, accounts, subscriptions, transactions, watchlist
  ├── form-filler/      Playwright-powered form autofill
  ├── habit/            Habit tracker with streaks
  ├── import-export/    Data import/export pipeline
  ├── inbox/            Gmail integration, ML email classification, action extraction
  ├── integrations/     Integration catalog cards
  ├── intelligence/     ML inference service, smart recommendations
  ├── jobs/             Background job runner + service
  ├── journal/          TipTap rich-text journal (autosave, transcription)
  ├── knowledge/        Knowledge item registry
  ├── metrics/          Internal metrics dashboard (13 sub-pages)
  ├── mood/             Mood logging widget
  ├── news/             News Intel — RSS/NewsAPI ingestion, ranking, search
  ├── notifications/    Notification bell, status dot
  ├── onboarding/       Multi-step onboarding flow (goals, integrations, workspace gen)
  ├── personalization/  Personalization service
  ├── platform/         Widget registry, dashboard library, platform persistence
  ├── pomodoro/         Pomodoro / focus timer
  ├── privacy/          Privacy policy, terms pages
  ├── reading/          Reading platform — Bible, Quran, PDFs, provider abstraction
  ├── recovery/         Addiction recovery trackers (heatmap, milestones, review)
  ├── scratchpad/       Quick-note scratchpad
  ├── search/           Global search bar + widget catalog
  ├── security/         Consent records + security page
  ├── settings/         General, profile, appearance, integrations, plan & billing
  ├── texteditor/       TipTap-based text editor + note manager
  ├── timekeeping/      Timer / stopwatch / event countdown widget
  ├── todo/             To-do list + habit section
  ├── tracking/         Health tracking — sleep, workout, meal, mood, supplements
  ├── ui/               Shared UI (Header, Footer, DatePicker, LoadingState)
  ├── uploads/          S3 file uploads + Google Drive browser (FilesWidget)
  ├── view/             File viewer (CSV, PDF, image, JSON parsers)
  ├── weather/          Open-Meteo weather widget
  ├── widgets/          Widget shell, settings panel, synthesis engine, builder
  ├── workflows/        n8n workflow trigger service
  └── worldclock/       World clock (analog + digital) widget
icons/                  SVG icon components (logo variants, domain icons)
lib/
  ├── aws/              S3 client + presigned URL helpers
  ├── connectors/       Google, Microsoft, GitHub, Linear, Slack connectors
  ├── n8n/              n8n client, webhook verification, schemas
  ├── observability/    Logger, Sentry, PostHog metrics
  ├── playwright/       Browser automation (form filler)
  ├── stripe/           Stripe client
  ├── supabase/         Server/admin/browser Supabase clients
  ├── utils/            Time utilities, TipTap helpers
  └── widget-tools/     Shared computation tools (finance, tracking, viz, time)
```

Each feature is self-contained: hooks, components, types, and services live together. Features do not import from other features directly — shared utilities go in `lib/`.

---

## Widget System

### Widget Types (28 renderable)

`texteditor`, `email`, `recovery`, `converter`, `chess`, `timekeeping`, `todo`, `weather`, `worldclock`, `mood`, `calendar`, `form-filler`, `datahealth`, `tracking`, `tracking-sleep`, `tracking-workout`, `tracking-meal`, `tracking-mood`, `tracking-supplements`, `context-diagram`, `chat`, `finance`, `widget-builder`, `files`, `reading`, `news`, `folder`, `recovery-empty`

### Widget Registration Pipeline

1. `WidgetType` union in `features/dashboard/types/dashboard.ts`
2. Lazy import + `case` in `features/dashboard/lib/renderWidgetContent.tsx`
3. `RENDERABLE_WIDGET_TYPES` array in `features/platform/lib/dashboardWidgetLibrary.ts`
4. Entry in `WIDGET_CATALOG` in `features/search/lib/widgetCatalog.ts`

### Widget Synthesis Engine (`features/widgets/synthesis/`)

Builds custom widgets from declarative intent:
- `intentParser.ts` — NLP → structured plan
- `synthesisPlanner.ts` — plan → assembly spec
- `capabilityGraph.ts` — tracks available data sources + actions
- `widgetAssemblyEngine.ts` — spec → runnable widget
- `componentRegistry.ts`, `dataSourceRegistry.ts`, `actionRegistry.ts` — 50+ registered capabilities

---

## ML Service Architecture

```
ml_service/
  ├── main.py                       FastAPI app, prediction endpoints
  ├── model_registry.py             Model versioning + A/B routing
  ├── drift_monitor.py              Input distribution drift detection
  ├── observability.py              Structured logging + metrics
  ├── schemas.py                    Pydantic request/response schemas
  ├── training_utils.py             TF-IDF + LogReg training helpers
  └── tests/                        pytest test suite (4 files, 728 LOC)
```

**Classification pipeline:**
1. ML model classifies intent/type (determines WHAT to do)
2. Regex/heuristics extract structured fields (determines HOW — dates, service names, amounts)

Models are TF-IDF + Logistic Regression pipelines (sklearn 1.4.2). In-house ML runs first; Claude is a fallback for paid tier only.

**Action classes (7):** `trial_end`, `payment_due`, `meeting`, `verification_needed`, `reply_required`, `deadline`, `ignore`

Confidence threshold: **0.35** (lowered from 0.45 — payment emails score ~0.37).

---

## Database Schema (Key Tables)

| Table                    | Purpose                                                         |
| ------------------------ | --------------------------------------------------------------- |
| `profiles`               | User profile, preferences                                       |
| `dashboard_layouts`      | Widget positions, scenes per user                               |
| `widget_settings`        | Per-widget configuration                                        |
| `widget_folders`         | Folder groupings                                                |
| `email_actions`          | Extracted email actions (type, due_date, synced)                |
| `email_queue`            | Pending email processing jobs                                   |
| `todos`                  | To-do items                                                     |
| `habits`                 | Habit definitions + completion history                          |
| `chess_positions`        | Saved chess positions                                           |
| `chess_study_chapters`   | Study chapter PGNs                                              |
| `recovery_trackers`      | Addiction tracker definitions                                   |
| `recovery_events`        | Check-ins, relapses, urges                                      |
| `mood_logs`              | Mood entries                                                    |
| `journal_entries`        | Rich-text journal (TipTap)                                      |
| `tracking_entries`       | Health log entries (sleep, workout, meal, mood, supplements)    |
| `tracking_goals`         | Per-category health goals                                       |
| `supplement_definitions` | User-defined supplement schedules                               |
| `countdown_events`       | Countdown / reminder events                                     |
| `currency_rates`         | Cached exchange rate snapshots                                  |
| `file_uploads`           | S3 object metadata (key, mime_type, status)                     |
| `finance_accounts`       | Bank/investment account balances                                |
| `finance_subscriptions`  | Recurring subscription tracking                                 |
| `finance_transactions`   | Manual transaction log                                          |
| `watchlist_items`        | Stock, crypto, and real estate watchlist                        |
| `context_entries`        | Context graph nodes (goals, widgets, integrations, memory)      |
| `chat_conversations`     | Multi-model chat history                                        |
| `user_tokens`            | OAuth tokens (Google, Microsoft)                                |
| `user_integration_keys`  | API keys for external integrations (per provider)               |
| `billing_subscriptions`  | Stripe subscription state                                       |
| `audit_logs`             | Admin action audit trail                                        |
| `feature_flags`          | Feature flag definitions + overrides                            |
| `background_jobs`        | Async job queue (status, retries)                               |
| `consent_records`        | User consent for data processing features                       |
| `reading_documents`      | Reading library docs (Bible, Quran, PDF; NULL user_id = shared) |
| `reading_positions`      | Last-read position + percent complete per user+document         |
| `reading_bookmarks`      | User bookmarks with optional labels                             |
| `reading_highlights`     | Position-range highlights with color                            |
| `reading_notes`          | Inline notes attached to positions                              |
| `reading_plans`          | Reading plans with streak + current day                         |

Row-Level Security is enabled on all user-owned tables. Admin client (service role key) is used only in server-side API routes.

---

## Data Flows

### Email Actions
```
Gmail API
  → /api/gmail/inbox         fetch + classify (ML service)
  → /api/gmail/extract-actions  extract actions (ML service)
  → email_actions table      store results
  → /api/gmail/actions/confirm  create Calendar events / Todos
```
Calendar events with midnight UTC use all-day `date` format to prevent wrong-day display in non-UTC timezones.

### Reading Platform
```
Client (ReadingWidget)
  → bootstrapProviders()         register mock + real providers
  → provider.listDocuments()     list available docs
  → provider.getContent(pos)     fetch content for current position
  → /api/reading/bible           scripture.api.bible proxy (server-side key)
  → /api/reading/pdf-url         S3 GetObject presigned URL (1h expiry, cached 55m)
  → /api/reading/{bookmarks,highlights,notes,progress}  annotations CRUD
```

### Finance
```
Client (FinanceWidget)
  → /api/finance/accounts        manual balances (Supabase)
  → /api/finance/watchlist/[id]/fetch  live quotes
      → Finnhub (stocks)
      → CoinGecko (crypto)
      → Zillow/Attom (real estate stub)
  → /api/finance/subscriptions   recurring costs (Supabase)
  → /api/finance/transactions    manual ledger (Supabase)
```

---

## Authentication

- Supabase Auth (email + Google OAuth)
- Google OAuth for Gmail/Calendar/Drive (scopes: gmail.readonly, calendar, drive.readonly)
- Microsoft OAuth for Outlook/OneDrive (`lib/connectors/microsoft/graphConnector.ts`)
- Tokens stored in `user_tokens` table; refreshed via `@supabase/ssr`
- Server Components use cookie-based session; Client Components use `createBrowserClient`
- Admin access: DB-driven `admin_role` table (checked via `lib/supabase/requireAdmin.ts`)

---

## Integrations

| Provider        | Method   | Connector / Notes                              |
| --------------- | -------- | ---------------------------------------------- |
| Google          | OAuth    | Gmail, Calendar, Drive                         |
| Microsoft       | OAuth    | Outlook, OneDrive via Graph API                |
| GitHub          | OAuth    | `lib/connectors/github/githubConnector.ts`     |
| Linear          | API key  | `lib/connectors/linear/linearConnector.ts`     |
| Slack           | OAuth    | `lib/connectors/slack/slackConnector.ts`       |
| Stripe          | Webhook  | Billing, checkout, portal                      |
| AWS S3          | SDK      | File uploads, PDF presigned URLs               |
| n8n             | Webhook  | Workflow automation triggers                   |
| Lichess         | API key  | Chess game import                              |
| Finnhub         | API key  | Stock quotes                                   |
| Anthropic       | API key  | Claude (chat + email fallback)                 |
| OpenAI          | API key  | GPT-4o (chat)                                  |
| Gemini          | API key  | Gemini (chat)                                  |
| scripture.api.bible | API key | Religious text provider (server proxy)     |
| Sentry          | DSN      | Error tracking (client + server + edge)        |
| PostHog         | API key  | Product analytics                              |

---

## Deployment

| Service      | Platform          | Notes                               |
| ------------ | ----------------- | ----------------------------------- |
| Next.js app  | Vercel            | Auto-deploy from main branch        |
| ML service   | Vercel (Python)   | `ml_service/` root                  |
| Database     | Supabase          | Managed Postgres + RLS              |
| File storage | AWS S3            | `uploads/{userId}/{fileId}{ext}`    |
| Local dev    | `npm run dev`     | concurrently runs Next.js + uvicorn |
