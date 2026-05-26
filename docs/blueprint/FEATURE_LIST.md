# WebWidgets Feature List

features/ Feature-scoped modules (65+ features)
├── accessibility/ Accessibility center widget and settings page
├── actions/ Action engine — extract, queue, execute email/calendar actions
├── admin/ Admin panel (users, flags, audit, metrics, ML, jobs)
├── analytics/ PostHog event tracking
├── audit/ Audit log service
├── auth/ Supabase Auth, Google OAuth, sign-in form
├── automation/ Automation evaluator + registry
├── backend/ Shared request utilities (requestUser, service registry)
├── billing/ Stripe plans, checkout, PricingCard, BillingCard
├── calculator/ Multi-mode calculator (basic, scientific, programmer, financial, datetime)
├── calendar/ Google Calendar integration (events, EventFormModal)
├── chatbot/ Multi-model AI chat (Claude, GPT-4o, Gemini)
├── chess/ Games library, analysis board, studies, move trainer
├── collaboration/ Collaborative workspace widget and page
├── context/ Context graph — knowledge nodes, AI memory, permissions
├── convert/ Unit + currency converter widget
├── countdown/ Event countdown widget
├── creative/ Creative studio widget and page
├── currency/ Exchange rate widget (Open Exchange Rates)
├── dashboard/ Widget grid, free canvas, drag-and-drop, scenes, folders
├── developer/ Developer tools page
├── feedback/ In-product user feedback
├── files/ File format conversion registry and service
├── finance/ Net worth, accounts, subscriptions, transactions, watchlist
├── form-filler/ Playwright-powered form autofill
├── habit/ Habit tracker with streaks
├── help/ In-product help system
├── import-export/ Data import/export pipeline
├── inbox/ Gmail integration, ML email classification, action extraction
├── integrations/ Integration catalog cards
├── intelligence/ ML inference service, smart recommendations
├── jobs/ Background job runner + service
├── journal/ TipTap rich-text journal (autosave, transcription)
├── knowledge/ Knowledge item registry
├── memorization/ Memorization widget and page
├── metrics/ Internal metrics dashboard
├── mood/ Mood logging widget
├── news/ News Intel — RSS/NewsAPI ingestion, ranking, search
├── notifications/ Notification bell, status dot
├── onboarding/ Multi-step onboarding flow (goals, integrations, workspace gen)
├── personalization/ Personalization service
├── platform/ Widget registry, dashboard library, platform persistence
├── pomodoro/ Pomodoro / focus timer
├── privacy/ Privacy policy, terms pages
├── reading/ Reading platform — Bible, Quran, PDFs, provider abstraction
├── recovery/ Addiction recovery trackers (heatmap, milestones, review)
├── research/ Research queue widget and workspace (Obsidian vault, academic pipeline)
├── scratchpad/ Quick-note scratchpad
├── search/ Global search bar + widget catalog
├── security/ Consent records + security page
├── settings/ General, profile, appearance, integrations, plan & billing
├── texteditor/ TipTap-based text editor + note manager
├── timekeeping/ Timer / stopwatch / event countdown widget
├── todo/ To-do list + habit section
├── tracking/ Health tracking — sleep, workout, meal, mood, supplements
├── tutorials/ In-product tutorials widget and page
├── ui/ Shared UI (Header, Footer, DatePicker, LoadingState)
├── uploads/ S3 file uploads + Google Drive browser (FilesWidget)
├── view/ File viewer (CSV, PDF, image, JSON parsers)
├── weather/ Open-Meteo weather widget
├── widgets/ Widget shell, settings panel, synthesis engine, builder
├── workflows/ n8n workflow trigger service
└── worldclock/ World clock (analog + digital) widget

- **Productivity**
  - `inbox` — Gmail integration, ML email classification, action extraction
  - `todo` — To-do list + habit section
  - `habit` — Habit tracker with streaks
  - `calendar` — Google Calendar integration (events, EventFormModal)
  - `pomodoro` — Pomodoro / focus timer
  - `timekeeping` — Timer / stopwatch / event countdown widget
  - `countdown` — Event countdown widget
  - `automation` — Automation evaluator + registry
- **Communication & AI**
  - `chatbot` — Multi-model AI chat (Claude, GPT-4o, Gemini)
- **Writing & Knowledge**
  - `journal` — TipTap rich-text journal (autosave, transcription)
  - `texteditor` — TipTap-based text editor + note manager
  - `scratchpad` — Quick-note scratchpad
  - `reading` — Reading platform — Bible, Quran, PDFs, provider abstraction
  - `news` — News Intel — RSS/NewsAPI ingestion, ranking, search
  - `research` — Research queue widget and workspace (Obsidian vault, academic pipeline)
  - `knowledge` — Knowledge item registry
- **Health & Wellness**
  - `recovery` — Addiction recovery trackers (heatmap, milestones, review)
  - `tracking` — Health tracking — sleep, workout, meal, mood, supplements
  - `mood` — Mood logging widget
- **Finance**
  - `finance` — Net worth, accounts, subscriptions, transactions, watchlist
  - `currency` — Exchange rate widget (Open Exchange Rates)
- **Learning**
  - `memorization` — Memorization widget and page
  - `tutorials` — In-product tutorials widget and page
- **Developer Tools**
  - `developer` — Developer tools page
- **Conversion & Utilities**
  - `convert` — Unit + currency converter widget
  - `calculator` — Multi-mode calculator (basic, scientific, programmer, financial, datetime)
  - `files` — File format conversion registry and service
- **Creative**
  - `creative` — Creative studio widget and page
  - `view` — File viewer (CSV, PDF, image, JSON parsers)
  - `form-filler` — Playwright-powered form autofill
- **General**
  - `weather` — Open-Meteo weather widget
  - `worldclock` — World clock (analog + digital) widget
  - `uploads` — S3 file uploads + Google Drive browser (FilesWidget)
- **AI & Intelligence**
  - `context` — Context graph — knowledge nodes, AI memory, permissions
  - `widgets` — Widget shell, settings panel, synthesis engine, builder
  - `intelligence` — ML inference service, smart recommendations
- **Collaboration**
  - `collaboration` — Collaborative workspace widget and page
- **Games & Strategy**
  - `chess` — Games library, analysis board, studies, move trainer
- **Accessibility**
  - `accessibility` — Accessibility center widget and settings page
- **Platform**
  - `dashboard` — Widget grid, free canvas, drag-and-drop, scenes, folders
  - `search` — Global search bar + widget catalog
  - `onboarding` — Multi-step onboarding flow (goals, integrations, workspace gen)
  - `settings` — General, profile, appearance, integrations, plan & billing
  - `billing` — Stripe plans, checkout, PricingCard, BillingCard
  - `import-export` — Data import/export pipeline
  - `notifications` — Notification bell, status dot
  - `integrations` — Integration catalog cards
  - `feedback` — In-product user feedback
  - `help` — In-product help system
- **Infrastructure**
  - `actions` — Action engine — extract, queue, execute email/calendar actions
  - `analytics` — PostHog event tracking
  - `audit` — Audit log service
  - `auth` — Supabase Auth, Google OAuth, sign-in form
  - `backend` — Shared request utilities (requestUser, service registry)
  - `jobs` — Background job runner + service
  - `metrics` — Internal metrics dashboard
  - `personalization` — Personalization service
  - `platform` — Widget registry, dashboard library, platform persistence
  - `privacy` — Privacy policy, terms pages
  - `security` — Consent records + security page
  - `admin` — Admin panel (users, flags, audit, metrics, ML, jobs)
  - `ui` — Shared UI (Header, Footer, DatePicker, LoadingState)
  - `workflows` — n8n workflow trigger service

## Tutorials

Onboarding flows and in-product guidance for widget setup and customization.

. This includes the major widgets, pages, integrations, dashboards, and workflow tools needed for WebWidgets

## Custom Widgets + API Integration

Third-party developers build widgets against the WebWidgets platform. Widgets integrate with the intent engine and appear in generated workspaces like native widgets.

## Cross-Widget Intelligence Goals

Examples:

- Workout tracked → nutrition adjustments update automatically
- Mood deterioration → recovery risk indicators increase
- Calendar overload → productivity recommendations adapt
- Email actions → calendar and tasks update automatically
- Research notes → quiz/study widgets update
- Finance stress → habit/recovery systems adapt
- Multiple inboxes/calendars → unified intelligent views

The system should evolve from:

- isolated widgets

Toward:

- cooperative intelligence systems

## Weave Architecture Goals

The weave system should support:

- shared context propagation
- event-driven updates
- unified action pipelines
- cross-widget recommendations
- multi-widget workflows
- graph-based relationships
- orchestration-aware widgets

Widgets should become nodes in a contextual intelligence graph.

# Widget Ecosystem

WebWidgets is a library of composable, domain-specific tools the intelligence layer assembles into workspaces.

Productivity
Email inbox (filtered, grouped, AI-actioned), to-do and reminders, kanban, calendar, Pomodoro timer, deep work timer, countdown timer

Knowledge & Writing
Journal, markdown notes, long-form editor, transcription, audio brain dump, auto-researcher, "On This Day" archive

Health & Body
Sleep tracker, injury/soreness heatmap, biometric trend chart, mood/energy logger, workout tracker, muscle heatmap, form debugger (video + AI feedback), nutrition/meal tracker, allergy checker, low-tox scanner, food symptoms tracker, supplement and intake tracker

Finance
Net worth, portfolio tracker (stocks, crypto, assets), subscription auditor, burn rate calculator, dividend income forecast, expense breakdown

Developer
API endpoint tester, terminal cheat sheet, database schema visualizer, system resource monitor, network speed test, cron job tracker, Docker container manager, logs streamer

Converter
Unit conversion, currency converter, file format converter

Creative
Canvas, photo gallery, vision board, SVG path visualizer, remove background

General
Weather, world clock, file storage, search (widget search + external app suggester), break timer

Games & Strategy
Chess (analysis board, move trainer, Stockfish integration), Trivia and other games

Employee/Employer Functions
Clock in/out

External Integrations
GitHub contribution heatmap, Obsidian vault explorer, YouTube video listener, trending music (X API), wrapper widget (external app + WebWidgets features)

- Widget configuration

A major planned feature is the Context Diagram: a graph-based visualization of user context across the app, APIs, database, files, widgets, workflows, automations, and inferred patterns.
Feedback,

## Productivity

- Email Inbox — Gmail and Outlook integration with ML-powered classification, action extraction, and action confirmation (create calendar events, todos)
- To-Do — Task list with subtasks, recurring tasks, and habits section
- Habit Tracker — Habit definitions with streaks and completion history
- Calendar — Google Calendar integration with event creation and management
- Pomodoro / Focus Timer — Pomodoro sessions and deep work timer modes
- Countdown / Timekeeping — Timer, stopwatch, and event countdown

---

## Communication

- AI Chat — Multi-model chat supporting Claude, GPT-4o, and Gemini with conversation history
- Automation — Automation evaluator and registry for conditional widget actions

---

## Writing & Knowledge

- Journal — TipTap rich-text journal with autosave, drafts, transcription
- Notes — Rich-text note editor with note manager
- Scratchpad — Quick-note scratchpad
- Reading — Reading platform for Bible, Quran, and PDFs; highlights, bookmarks, inline notes, reading plans with streak tracking
- News — News Intel with RSS/NewsAPI ingestion, ML ranking, and search
- Research Queue — Research workspace with queue management

---

## Health & Wellness

- Recovery Tracker — Addiction recovery tracker with streaks, heatmap, urge and relapse logging, milestones
- Health Tracking — Comprehensive logging for sleep, workouts, meals, mood, and supplements with goals
- Mood Logger — Mood and energy logging with history

---

## Finance

- Finance — Net worth tracker, manual account balances, subscription auditor, transaction log, stock/crypto/real estate watchlist with live quotes

---

## Learning

- Memorization — Memorization widget and page
- Tutorials — In-product tutorials and onboarding guidance

---

## Developer Tools

- Developer Tools — Developer tools page with API tester, terminal cheat sheet, schema visualizer, system monitor, and more

---

## Conversion & Utilities

- Unit & Currency Converter — Unit conversion across categories and live exchange rates
- Calculator — Calculator with multiple modes and history
- File Format Converter — File conversion service (separate Go/Python sidecar)

---

## Creative

- Creative Studio — Creative studio widget and workspace page
- File Viewer — Universal viewer for CSV, PDF, images, JSON, and markdown; supports annotations and transforms
- Form Filler — Playwright-powered browser form autofill

---

## General

- Weather — Local weather forecast via Open-Meteo
- World Clock — Analog and digital world clocks with multi-timezone support
- File Storage — S3 file uploads and Google Drive browser

---

## AI & Intelligence

- Context Diagram — Context graph with knowledge nodes, goal tracking, and AI memory
- Widget Builder — Custom widget synthesis from natural language intent via synthesis engine
- ML Inference — Email classification, action extraction, and widget suggestions (TF-IDF + Logistic Regression; Claude fallback for paid tier)

---

## Collaboration

- Collaboration Workspace — Collaborative workspace widget and page

---

## Games & Strategy

- Chess — Analysis board, move trainer, study chapters, PGN import, Lichess game sync

---

## Accessibility

- Accessibility Center — Accessibility settings widget and page

---

## Platform

- Dashboard — Widget grid and free canvas with drag-and-drop layout, scenes, folders, and widget bucket
- Search — Global search bar and widget catalog with suggestions
- Onboarding — Multi-step setup flow covering goals, integrations, and initial workspace generation
- Settings — Profile, appearance, integrations, and plan management
- Billing — Stripe subscription management with checkout and customer portal
- Import / Export — Data import and export pipeline
- Notifications — Notification bell, status dot, and alert system
- Integrations — Integration catalog for Google, Microsoft, GitHub, Linear, Slack, and more
- Admin — Internal admin panel covering users, feature flags, audit logs, metrics, ML, and background jobs
- Feedback — In-product user feedback
- Help — In-product help system

### Product Overall

- Main Website
  - WebWidgets.me
  - http://webwidgets.you (Future Redirect)
- Handbag Mode
  - Web Extension
    - Cross-Site Cart/Product Saving
  - Overlay-Based Tab
    - Take Certain widgets with you
- Desktop and Mobile App
- Tutorials
- Custom Widgets
  - API Integration
- Unsorted Suggestions
  - Break Timer for Workouts
  - Remove Background

* Tree Diagram: Logo
* Literal Context Diagram (modifiable)
  - LLM History
* Live Resume
* Personal Documents
* Accessibility
* Food Delivery
* Memorization
* Drawing, Graphic Design
* Weight loss plan
* Not overwhelming
* Screen Viewer
* Code Editor, Terminal
* Collaboration/Workspace Sync
* Summarize data (tables)
* Paste and include reference
* Workplace based injury log, image attachment, tag others
* Reference: Driver 360emkay, furl station locater, mileage, communication, vehicle inspection (Company App Wrapper)
* Demo w/o signin
* Webwidgets CLI - One for users, one for launching services

### Utility

- (Text Editor) App
  - Journal
    - Temporary Delete
  - Notes
    - Long-Form Transcription
    - Markdown Note Editor
    - Auto-Researcher
      - Notes Compilation
      - "On This Day" Historical Archive
    - (Audio) Brain Dump
  - General Editor
    - Long-Form Editor

* (Productivity) App
  - Smart Email Inbox (Filtered, Grouped)
    - AI Email-Based Insights and Actions
    - Weave Inboxes feature
  - To-Do and Reminders
    - Kanban Task Board
    - Reminders (+Notifs)
  - Calendar
    - Event Adding (Super Custom)
    - Calendar weave
  - Pomodoro / Deep Work Timer
* (Converter) App
  - Unit Conversion
  - Currency Converter
  - File Format Converter

- (General) App
  - Local Weather Forecast
  - Clock
    - World Clock
    - Time zones
  - File Storage
- Tracker(s) App
  - Health
    - Sleep Tracker
      - Quality
      - Duration
    - Injury
      - Injury and Soreness Heatmap
    - Biometric Trend Chart (HRV/RHR)
    - - Mood / Energy Logger
  - Recovery Tracker
    - Addiction Quitting
    - Low-Profile Mode (UI)
    - Sync: Mood Track
  - Workout Tracker
    - Volume Monitor
    - Goals
    - Highlight Muscles Targeted (Combine with Pain Monitor)
    - Transcribe workout
    - Form Debugging
      - Videos
      - AI feedback
  - Nutrition
    - Weight Tracker
    - BMI Calculator
    - Food Search
    - Meal Tracker
      - Add Foods, Meals
    - Food Reception
      - Allergy Checker
      - Low-Tox Scanner
      - Food Symptoms
  - Intake Tracker
    - Supplements List
    - Med Checklist
    - Reminders
  - Trending Music (X API)
    - Auto-Add Music
- (Finance) App
  - Net Worth
    - Portfolio
    - Subscription Auditor
    - Monthly Burn Rate Calculator
    * Dividend Income Forecast
    * Expense Category Pie Chart
      - From Excel
  * Asset Monitor
    - Traditional Stocks
    - Crypto
    - Utilities (Oil, etc.)
- Search Bar
  - Widget Search and Suggester
  - External Website/App Suggester

### Miscellaneous

- API Endpoint Tester
- Terminal / Command Cheat Sheet
- Database Schema Visualizer
- System Resource Monitor (CPU/RAM)
- Network Speed Test
- Cron Job Status Tracker
- Docker Container Manager
- Logs Streamer (FastAPI/Supabase)
- Canvas
- Chess Helper
  - Repertoire Generator
  - Move Trainer
  - Analysis Board
  -
- SVG Path Visualizer
- Photo Gallery / Vision Board

### External/Wrapper-Based

- GitHub Contribution Heatmap
- Obsidian Vault Explorer
- Wrapper Widget: External App Functionality + WebWidgets features
  - YouTube (video listener)
