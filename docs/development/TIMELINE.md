# WebWidgets Development Timeline

Target: **launchable — one vertical mastered — by August 25, 2026.**

## Design Principle (Integration Order)

1: All Widgets/Features
2: Hypermodern UI
3: ML Predictions
4: Widget-Based Actions 5) Automation of Widget Actions 6) Hyper-Personalization of all of the above 7) Security 8) Deployment, feedback, refinement loop

---

## Strategic Reframe

The original roadmap was building fragments of Notion, Todoist, TradingView, Lichess, Google Workspace, health trackers, and media apps simultaneously by August. That's fantasy scheduling.

The actual product is not a widget collection. It is an **orchestration intelligence layer**. The moat is the system that determines which tools appear, why, when, how they interact, and how they evolve. Every individual widget is replaceable. The orchestration is not.

This timeline is rebuilt around that priority.

### The Wedge

Launching broad horizontal utility software from day one almost always fails. One vertical needs to be genuinely mastered first — not demo-good, but daily-use good.

The natural wedge given existing infrastructure (email AI, calendar, todos, journal): **knowledge-worker productivity workspace.**

> "Give me a head start on my day."

Generated workspace: email triage + priority inbox + action extraction + calendar context + task queue + focus timer.

This is already partially built. The orchestration layer will make it feel like magic.

Everything else — health, finance, chess, developer tools, creative — ships later, powered by the same engine.

---

## Completed

### Foundation ✅ (May 2026)

- [x] ML classifier replaces regex action extraction (7-class model, 0.969 accuracy)
- [x] sklearn version alignment across training/inference environments
- [x] Calendar event timezone fix (all-day `date` format for midnight UTC)
- [x] Docker + Supabase predev automation
- [x] `.gitattributes`, `.gitignore` audit
- [x] Chess analysis board + study chapters

### Sprint 1 — Performance & Stability ✅ (May 19 – May 30)

- [x] Auth bootstrap: `AuthProvider` context, single Supabase subscription across entire app
- [x] Widget settings bulk API: `WidgetSettingsProvider`, one query replaces N per-widget queries
- [x] Timer render throttling: shared `TickProvider` pauses on hidden tabs
- [x] Theme system provider: FOWT-prevention inline script, global `Providers` wrapper
- [x] Inbox reconnect: `isUnauthorized` resets on user identity change
- [x] Calendar reconnect: `isNotConnected` clears on successful fetch and refresh
- [x] Weather reliability: `res.ok` check, saved coordinates skip repeated geolocation prompts
- [x] Currency cache: Zod validation on localStorage parse
- [x] `useTrackers` null fix, `useWidgetSettings` loading fix, `useEmailActions` retry fix
- [x] Data health widget: live status for Supabase, ML service, Gmail, Calendar
- [x] Feature test coverage: 187 tests total

---

## Phase 1 — Orchestration Foundation (Jun 1 – Jun 20)

**This is the company.** Without it, WebWidgets is just a widget grid with a nice theme.

The goal is a working kernel: user states intent → system generates a workspace plan → widgets are injected → session is remembered.

---

### Sprint 2 — Intent Parser: Core (Jun 1 – Jun 6)

The layer that turns natural language into a structured workspace directive, part one.

- [ ] Intent classification endpoint (`/api/intent/parse`) — wraps ML suggester with structured output
- [ ] Intent schema: `{ domain, goal, constraints, confidence, suggestedWidgets[], suggestedActions[] }`
- [ ] Domain classifier: routes to the correct orchestration handler (productivity, research, chess, etc.)
- [ ] Unit tests: intent schema validation, domain classifier routing

---

### Sprint 3 — Intent Parser: Completion + Session Schema (Jun 9 – Jun 13)

- [ ] Constraint extraction: time pressure, depth of focus, available context
- [ ] Confidence gate: below threshold → prompt clarification instead of guessing
- [ ] Session event log schema design: `{ userId, intentText, domain, plan, widgetInteractions[], outcome, timestamp }`
- [ ] Supabase `sessions` table: append-only, indexed by user + timestamp
- [ ] Unit tests: constraint extraction edge cases, confidence gate boundary behavior

---

### Sprint 4 — Workspace Engine + Session Memory (Jun 16 – Jun 20)

The layer that turns an intent plan into a live workspace, and the memory layer that seeds it.

- [ ] Widget registry abstraction: declarative map of `{ widgetType → capabilities, dataRequirements, compatibleDomains }`
- [ ] Layout plan generator: takes intent output → returns ordered widget config
- [ ] Dynamic widget injection: adds widgets to live layout without page reload
- [ ] Workspace versioning: each generated workspace is a named snapshot (can return to it)
- [ ] Intent prompt UI on homepage: replaces the empty state with a natural language input
- [ ] Workspace confirmation UI: shows the plan before committing (user can edit)
- [ ] Context window loader: seeds intent parser with last N sessions per user
- [ ] Cold-start defaults: curated first-session experience for new users with no history
- [ ] Observability: orchestration tracing (intent → plan → layout diff → widget mount)
- [ ] Observability: confidence calibration log, slow-intent alerting (> 500ms), performance timing marks

---

## Phase 2 — One Vertical Mastered (Jun 23 – Jul 11)

**Knowledge-worker productivity workspace.** Not demo-good — daily-use good.

The goal: when a user says "Get me started for the day," the generated workspace is so precise it feels like the system read their mind.

---

### Sprint 5 — Productivity Wedge: Tasks + Notifications (Jun 23 – Jun 27)

- [ ] Edit to-do items (currently insert-only)
- [ ] Kanban view option for tasks
- [ ] Reminders + browser push notifications
- [ ] Task test coverage: edit, delete, kanban state transitions

---

### Sprint 6 — Productivity Wedge: Calendar + Journal + Pomodoro (Jun 30 – Jul 4)

- [ ] Calendar event creation from within the widget
- [ ] Journal: entry titles, fix editor/entries sizing, quote-in-list bug
- [ ] Pomodoro: session history, stabilize existing timer
- [ ] "Productivity morning" workspace template: inbox triage + calendar + task queue + focus timer

---

### Sprint 7 — Orchestration Applied to the Wedge (Jul 7 – Jul 11)

- [ ] Action extraction feeding directly into task queue (email → todo without manual confirm)
- [ ] Cross-widget data links: email action → calendar event → todo, all visible in one workspace
- [ ] Workspace-aware context: intent parser knows about user's current tasks, upcoming meetings, inbox state
- [ ] "Find Tasks" proactive scan: checks email + calendar for upcoming deadlines, surfaces them automatically
- [ ] Per-user widget usage events: which widgets opened, time in widget, actions taken
- [ ] Usage-weighted workspace ordering: frequent tools appear first in generated plans
- [ ] Dismissal memory: dismissed widgets excluded from future suggestions for that intent class
- [ ] Time-of-day signals: different defaults for morning/afternoon/evening intent patterns

---

## Phase 3 — Personalization Depth (Jul 14 – Aug 1)

Superficial personalization (widget ranking, dismissal memory) was Phase 2. This phase builds the adaptive intelligence that makes the product genuinely sticky.

---

### Sprint 8 — Longitudinal Behavior Modeling (Jul 14 – Jul 18)

- [ ] Workflow outcome tracking: did the generated workspace lead to a productive session? (signal: session length, widget engagement, tasks completed)
- [ ] Intent evolution tracking: how does user's typical intent change over days/weeks?
- [ ] Workspace success attribution: which widget combinations correlate with session success?
- [ ] User context graph: persistent model of user's domains, habits, strengths, ongoing projects

---

### Sprint 9 — Adaptive Feedback Loops (Jul 21 – Jul 25)

- [ ] Reinforcement signal pipeline: session outcomes → model update queue → next-session confidence adjustment
- [ ] Confidence calibration over time: personalized confidence thresholds per intent class per user
- [ ] Layout mutation tracking: when users manually modify a generated workspace, learn from it
- [ ] Workspace A/B scaffolding: test two layout variants silently, measure engagement diff
- [ ] Preference learning: surface implicit preferences (always moves chess widget to top → chess appears first in any workspace)

---

### Sprint 10 — Recommendation Correction (Jul 28 – Aug 1)

- [ ] Explicit feedback UI: "Was this workspace helpful?" (thumbs, optional text)
- [ ] Negative signal capture: rejected widgets, closed sessions, abandoned workspaces
- [ ] Recommendation decay: stale patterns lose weight without reinforcing signals
- [ ] Cold-start acceleration: new users get better defaults faster from domain hints at signup

---

## Phase 4 — Premium Intelligence Architecture (Aug 4 – Aug 15)

Build the infrastructure that enables monetization and model quality improvement over time.

---

### Sprint 11 — Model Routing + Tier Enforcement (Aug 4 – Aug 8)

- [ ] Model router: `{ intent, user tier, confidence, latency budget }` → selects model (in-house ML vs Claude)
- [ ] Cost-aware orchestration: track per-request token cost, enforce per-user monthly budget
- [ ] Tier enforcement: free tier uses in-house ML only; paid tier unlocks Claude fallback
- [ ] Async orchestration queue: heavy intent parsing runs async, returns plan via polling/webhook
- [ ] Provider failover: if Claude API is down, degrade gracefully to ML-only mode

---

### Sprint 12 — Failure Resilience + Caching (Aug 11 – Aug 15)

- [ ] Intent parser fallback: if ML service is unreachable, show curated defaults by time-of-day
- [ ] State reconciliation: detect and resolve layout drift between localStorage and DB
- [ ] Workspace recovery: if a workspace generation fails mid-flight, restore previous state cleanly
- [ ] Error boundaries at orchestration level: widget failure doesn't collapse entire workspace
- [ ] Workspace plan caching: identical intents with matching context return cached plan (TTL: 10min)
- [ ] Widget data stale-while-revalidate: cached data renders immediately, background refresh updates silently
- [ ] Session context caching: last N sessions cached in memory for fast intent personalization

---

## Phase 5 — Polish + Launch (Aug 18 – Aug 25)

One week. Focused entirely on launchability.

---

### Sprint 13 — Launch Prep (Aug 18 – Aug 21)

- [ ] Landing page (webwidgets.me) — what it is, who it's for, what it does
- [ ] Onboarding flow: collect domain hint, create first workspace from intent prompt
- [ ] Auth hardening: sign-out reliability, session expiry, token refresh edge cases
- [ ] Privacy Policy + Terms of Service pages
- [ ] Basic billing scaffolding (Stripe, free vs paid tiers)

---

### Sprint 14 — Ship (Aug 24 – Aug 25)

- [ ] Sentry error review and triage
- [ ] Full regression pass on the productivity wedge
- [ ] Core observability dashboard (Sentry + data health widget)
- [ ] Go / no-go review: orchestration kernel working end-to-end, wedge daily-use quality, billing live

---

## Post-Launch — Expand the Widget Library (Sep 2026+)

Once the orchestration layer is genuinely working and the wedge is mastered, the widget library can expand without risk of becoming "47 half-working widgets."

Each new domain ships in this order:

1. Orchestration support: intent parser learns the new domain
2. One polished workflow: daily-use quality, not demo quality
3. Personalization integration: session memory tracks behavior in the new domain

**Next verticals (in priority order):**

1. Recovery / wellness wedge — already partially built, strong differentiation
2. Chess / strategic thinking wedge — already built, clear audience
3. Research intelligence — dynamic research dashboards, source synthesis
4. Student wedge — study planner, adaptive flashcards, exam prep
5. Finance — net worth, subscription auditor, burn rate
6. Health + fitness — sleep, workout, nutrition
7. Developer ops — API tester, logs, Docker, schema viz
8. Creative — canvas, gallery, vision board
9. Handbag Mode — web extension, overlay tab

**Also post-launch:**

- Desktop and mobile app
- Custom widget API (third-party developers)
- Wrapper widget framework (YouTube, GitHub, Obsidian)
- Weave (inter-widget data sharing across domains)
- Widget Bucket, cropping, clipping UI system
