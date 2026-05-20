# WebWidgets Architecture

## Overview

WebWidgets is a Next.js App Router application with a Python FastAPI ML sidecar. The two services are deployed independently — Next.js to Vercel, ML service to a separate Vercel Python runtime. They communicate over HTTP via `ML_SERVICE_URL`.

---

## Service Topology

```
Browser
  │
  ├── Next.js (Vercel)
  │     ├── App Router (RSC + Client Components)
  │     ├── API Routes (/app/api/**)
  │     │     ├── Gmail/Calendar (Google OAuth, googleapis)
  │     │     ├── Chess (Supabase reads)
  │     │     └── ML proxy (forwards to ML service)
  │     └── Supabase client (RLS, real-time)
  │
  ├── ML Service (FastAPI, Vercel Python runtime)
  │     ├── POST /classify       → email label classification
  │     ├── POST /suggest        → widget suggestions from intent
  │     └── POST /extract-actions → email action extraction
  │
  └── Supabase (database + auth + real-time)
```

---

## Frontend Structure

```
app/                    Next.js App Router pages and API routes
features/               Feature-scoped modules
  ├── auth/             Session management
  ├── dashboard/        Layout, widget grid, drag-and-drop
  ├── inbox/            Gmail integration, action extraction
  ├── calendar/         Google Calendar integration
  ├── chess/            Analysis board, study chapters
  ├── recovery/         Addiction recovery trackers
  ├── journal/          TipTap-based text editor
  ├── weather/          Open-Meteo integration
  ├── currency/         Exchange rate widget
  ├── pomodoro/         Focus timer
  ├── countdown/        General countdown timer
  ├── mood/             Mood logging
  └── widgets/          Widget shell, settings, visibility
icons/                  SVG logo/icon components
```

Each feature is self-contained: hooks, components, and types live together. Features do not import from other features directly — shared utilities go in `lib/`.

---

## ML Service Architecture

```
ml_service/
  ├── main.py                       FastAPI app, prediction endpoints
  ├── models/
  │     ├── email_classifier.pkl    TF-IDF + LogReg (email labels)
  │     ├── widget_suggester.pkl    TF-IDF + LogReg (widget suggestions)
  │     └── action_extractor.pkl   TF-IDF + LogReg (action type, 7 classes)
  └── training/
        ├── actions.json            381 labeled examples (7 classes)
        ├── train_classifier.py
        ├── train_suggester.py
        └── train_action_extractor.py
```

**Classification pipeline:**

1. ML model classifies intent/type (determines WHAT to do)
2. Regex/heuristics extract structured fields (determines HOW — dates, service names, amounts)

Models are TF-IDF + Logistic Regression pipelines (sklearn 1.4.2). In-house ML runs first; Claude is a fallback for paid tier only.

**Action classes:** `trial_end`, `payment_due`, `meeting`, `verification_needed`, `reply_required`, `deadline`, `ignore`

Confidence threshold: **0.35** (lowered from 0.45 — Klarna-style payment emails score ~0.37).

---

## Database Schema (Key Tables)

| Table                  | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| `profiles`             | User profile, preferences                        |
| `dashboard_layouts`    | Widget positions per user                        |
| `widget_settings`      | Per-widget configuration                         |
| `widget_folders`       | Folder groupings                                 |
| `email_actions`        | Extracted email actions (type, due_date, synced) |
| `todos`                | To-do items (no due_date column)                 |
| `chess_positions`      | Saved positions                                  |
| `chess_study_chapters` | Study chapter PGNs                               |
| `recovery_trackers`    | Addiction tracker definitions                    |
| `recovery_events`      | Check-ins, relapses, urges                       |
| `mood_logs`            | Mood entries                                     |
| `journal_entries`      | Journal/notes                                    |

Row-Level Security is enabled on all user-owned tables. Admin client (service role key) is used only in server-side API routes.

---

## Data Flow: Email Actions

```
Gmail API
  → /api/gmail/inbox         fetch + classify (ML service)
  → /api/gmail/actions       extract actions (ML service)
  → email_actions table      store results
  → /api/gmail/actions/confirm  create Calendar events / Todos
  → Google Calendar API      (for event type actions)
  → todos table              (for deadline/todo type actions)
```

Calendar events with midnight UTC timestamps use all-day `date` format (not `dateTime`) to prevent wrong-day display in non-UTC timezones.

---

## Authentication

- Supabase Auth (email + OAuth)
- Google OAuth for Gmail/Calendar access (scopes: gmail.readonly, calendar)
- Tokens stored in Supabase session; refreshed via `@supabase/ssr`
- Server Components use cookie-based session; Client Components use `createBrowserClient`

---

## Deployment

| Service     | Platform        | Notes                               |
| ----------- | --------------- | ----------------------------------- |
| Next.js app | Vercel          | Auto-deploy from main branch        |
| ML service  | Vercel (Python) | `ml_service/` root                  |
| Database    | Supabase        | Managed Postgres                    |
| Local dev   | `npm run dev`   | concurrently runs Next.js + uvicorn |
