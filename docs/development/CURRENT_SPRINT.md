# Current Sprint — Phase 1: Orchestration Foundation

**Period:** June 1 – June 20, 2026
**Goal:** Build the kernel. Intent → plan → workspace → session memory. Without this, WebWidgets is just a widget grid.

---

## Active Tasks

### Intent Parser

- [ ] Intent classification endpoint (`/api/intent/parse`)
- [ ] Intent schema: `{ domain, goal, constraints, confidence, suggestedWidgets[], suggestedActions[] }`
- [ ] Domain classifier (productivity, research, chess, wellness, etc.)
- [ ] Constraint extraction (time pressure, focus depth, available context)
- [ ] Confidence gate: below threshold → clarification prompt instead of guess

### Workspace Generation Engine

- [ ] Widget registry abstraction (declarative capabilities + domain map)
- [ ] Layout plan generator: intent output → ordered widget config
- [ ] Dynamic widget injection (add to live layout without page reload)
- [ ] Workspace versioning (named snapshots, can return to previous)
- [ ] Intent prompt UI on homepage (replaces empty state)
- [ ] Workspace confirmation UI (show plan, let user edit before committing)

### Session Memory Layer

- [ ] Session event log schema + Supabase table
- [ ] Session recorder: intent, plan, widget interactions, outcome, timestamp
- [ ] Context window loader: seed intent parser with last N sessions
- [ ] Cold-start defaults for new users

### Observability

- [ ] Orchestration tracing (intent → plan → layout diff → widget mount)
- [ ] Confidence calibration log (distribution over time)
- [ ] Slow-intent alerting (> 500ms)
- [ ] Dashboard performance timing marks

---

## Completed This Sprint

_(none yet)_

---

## Blocked / Waiting

_(none)_

---

## Notes

- The orchestration layer is the moat. Everything else is replaceable.
- See `TIMELINE.md` for full strategic context and phase breakdown.
- Sprint 1 (Performance & Stability) completed 2026-05-16.
