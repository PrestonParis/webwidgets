# WebWidgets Roadmap

This is the canonical, evidence-based assessment of where WebWidgets stands
and what's between here and a shippable V1. It fulfills the role
`docs/blueprint/CURRENT_STATE.md` was meant for (that file was never filled
in — it now points here) and reconciles that gap against
[docs/blueprint/VISION.md](docs/blueprint/VISION.md),
[FEATURE_LIST.md](docs/blueprint/FEATURE_LIST.md),
[PREDICTION_LIST.md](docs/blueprint/PREDICTION_LIST.md),
[WIDGET_ACTIONS.md](docs/blueprint/WIDGET_ACTIONS.md),
[PERSONALIZE.md](docs/blueprint/PERSONALIZE.md), and
[SECURITY.md](docs/blueprint/SECURITY.md), which remain the detailed scope
docs for later-stage work — this file is the prioritized, maturity-rated
summary that sits above them.

**Stated target:** "Fully functional Website App V1" by **August 25, 2026**
(`VISION.md`). Today is 2026-08-12 — under two weeks out. Given the gaps
below (an untracked schema, unverified RLS, ~1,600 existing lint errors,
half the e2e test scripts still pointing at nonexistent directories, and CI
that gates changed files but not the existing debt baseline), this date
should be treated as **at risk**, not a firm commitment, unless the
V1-required items in §3 are triaged first.

---

## 1. VISION.md's stage claim vs. the evidence

`VISION.md` states development is "firmly in stage one" of its 8-stage plan
(All Widgets/Features → UI → ML Predictions → Widget Actions → Automation →
Personalization → Security → Deployment) — meaning, by that framing, nothing
past basic feature breadth should exist yet.

The codebase contradicts this in both directions:

- **Ahead of stage 1 in several places:** a working ML service with 10
  trained-model scripts (news ranking, health trend, document
  classification, task priority, finance anomaly, memorization card
  quality, action extraction/detection, chat intent — stage 3 territory); a
  full widget synthesis engine (intent → capability graph → assembly, stage
  2/4 territory); an adaptive dashboard runtime scheduler; a finished
  onboarding flow with personalization steps (stage 6 territory); and a live
  Vercel production deploy with cron jobs (stage 8, "last").
- **Behind stage 1 in other places:** `docs/blueprint/SECURITY.md` (stage 7)
  is an unimplemented checklist, and the schema/migration story (§3) is not
  something any later stage has cleaned up.

**Conclusion: the 8-stage sequential framing doesn't match how the codebase
actually developed** (breadth-first across stages, not strictly sequential).
Treat the stage list as a useful checklist of scope areas, not as a reliable
signal of what's built. This ROADMAP's maturity table below is the accurate
picture; don't infer maturity from which VISION.md stage a feature is filed
under.

---

## 2. Maturity by system

`working` = built and in active use · `partial` = built but incomplete,
unverified, or has known gaps · `broken` = present but non-functional ·
`missing` = not started · `unknown` = needs investigation before relying on
it.

| System | Maturity | Notes |
|---|---|---|
| Dashboard / widget grid | working | Drag-and-drop, scenes, folders, adaptive runtime scheduler. Highest-churn area of the codebase. |
| Widget registration pipeline | working, fragile | Functions, but requires 6 coordinated edits across 4 files per new widget — see ARCHITECTURE.md §4. High merge-conflict risk. |
| Widget synthesis engine | partial | Fully built pipeline (intent → capability graph → assembly); real-world usage/coverage not verified in this audit. |
| View widget (file viewer) | working | Full parse/render/analyze/edit/export pipeline for 8+ formats. |
| Inbox / email actions | working | 3-tier hybrid (rules → in-house ML → Claude fallback), 7 action classes, confidence-tuned (ADR-007). |
| Calendar | working | Google Calendar integration, all-day date bug fixed (ADR-003). |
| Finance | working | Live quotes (Finnhub, CoinGecko); real-estate watchlist is a stub. |
| Health tracking / recovery / habit | working | Actively developed — these are the highest-churn feature areas in git history. |
| Chess | working, suspended beta | Lichess sync, PGN import, studies, and move trainer remain available to existing users but are outside V1 defaults and completion claims. |
| Reading platform | working, suspended beta | Bible/Quran/PDF via provider abstraction, annotations, and plans remain available to existing users but are outside V1 defaults and completion claims. |
| Creative Studio / Memorization | working, suspended beta | Existing widgets and data paths remain intact; both are excluded from V1 onboarding, generated workspaces, and automatic recommendations. |
| Timeline Intelligence (`news`) | partial | The stable V1 surface remains discoverable outside Entertainment; the broader personal-event timeline and durable ingestion loop are still finalization work. |
| Context graph (`features/context/`) | partial | Newest major subsystem. Only Supabase migration in the repo backs it; that migration has no RLS statements. |
| Knowledge registry (`features/knowledge/`) | unknown | Boundary vs. `context` is undocumented — see ARCHITECTURE.md §11. |
| ML service | working | FastAPI, model registry, drift monitor, 4-file pytest suite, 10 training scripts. |
| Go worker (cache/snapshot/events) | broken | All 3 subsystems are stub no-ops (identical `// TODO: In future phases` markers). Nothing depends on it persisting data safely today. |
| Conversion service | partial | Functional locally via docker-compose; no production deploy path found; self-documented unsanitized-HTML-input gap (security). |
| Sync worker | unknown | No test coverage at all; not deeply audited. |
| Onboarding | working | Goal discovery, intent capture, widget selection, workspace generation — described as a finished pass. |
| Admin panel | unknown | Feature-complete per FEATURE_LIST.md scope (users/flags/audit/metrics/ML/jobs); functional depth not verified. |
| Billing (Stripe) | working | Checkout, webhooks, customer portal present. |
| Automation (stage 5) | partial | Evaluator + registry exist; `docs/blueprint/AUTOMATION_GUIDE.md` (the stage's own scope doc) is empty. |
| Personalization (stage 6) | partial | Cross-widget intelligence goals documented in PERSONALIZE.md; onboarding-time personalization exists; full cross-widget adaptation (e.g. "workout tracked → nutrition adjusts") not verified as implemented. |
| ML predictions beyond email (stage 3) | partial | Multiple training scripts exist server-side; whether each is wired into a live prediction surface in the UI is unverified per-model. |
| Widget-based actions (stage 4) | partial | Email/calendar action-confirm flow exists; other items in WIDGET_ACTIONS.md (generate document, export data, summarize file, trigger workflow) not individually verified. |
| Security (stage 7) | partial/unknown | SECURITY.md is an unimplemented checklist. Only verified concrete control: service-role key confined to server routes (ADR-005). RLS presence is unverifiable from tracked migrations. |
| Deployment (stage 8) | working (partially) | `apps/web` already auto-deploys to Vercel on push to main — ahead of its own stage. Conversion/sync-worker/go-worker have no production path. |
| Schema/migration tracking | broken | Only 1 of what's clearly a large schema is tracked in `supabase/migrations/`. |
| CI | working (baseline) | `.github/workflows/ci.yml` gates changed files only (lint/typecheck/tests/build); see `.github/workflows/README.md`. Branch-protection required-checks still need repo-owner configuration — not something a workflow file alone can do. |
| Automated test coverage | partial | 52 unit test files (shallow, one per domain); e2e has heavy scaffolding but only 3 real spec files; 4 of 8 `test:*` e2e npm scripts point at nonexistent directories. |
| Local commit-time quality gates | broken | Husky is installed but no `.husky/pre-commit` script exists — nothing is actually enforced at commit time today. |

---

## 3. V1 required

Work that blocks calling WebWidgets a shippable V1, or blocks the agentic
workflow this bootstrap sets up from being trustworthy.

- **Configure branch protection to require the CI checks** — the workflow
  (`.github/workflows/ci.yml`) exists and gates changed files on every PR,
  but marking its jobs as required status checks on `main` is a repository
  settings change only the repo owner can make (Settings → Branches). Until
  that's done, CI runs and reports but doesn't actually block a merge.
- **Reconcile the migration/schema gap** — only one migration is tracked
  against what is clearly a much larger live schema. Any agent making a
  schema change needs a real baseline to diff against, and RLS coverage
  can't be verified without it.
- **RLS audit** — confirm policies actually exist and are correct on
  user-owned tables; currently unverifiable from the repo alone.
- **Fix the unsanitized-HTML-input gap** in the conversion pipeline
  (self-flagged in 3 files) — a live security TODO, not speculative.
- **Prune or fix the broken e2e npm scripts** (`test:dashboard`,
  `test:performance`, `test:hydration` target directories that don't exist)
  — a DEFINITION_OF_DONE that references these as gates would be lying.
- **Resolve the ML service deploy target** (Vercel Python vs. Procfile) —
  ambiguous infra is a bad foundation for agents wiring new ML endpoints.
- **Wire or formally drop Husky commit-time gating** — currently a dead
  no-op that looks like protection but isn't.

---

## 4. V1 important

Should happen before or shortly after V1, not hard-blocking.

- **Orphaned page audit** — 10 pages with zero internal nav links
  (`/personalization`, `/documents[/id]`, `/chess/[id]`,
  `/chess/studies/[studyId]`, `/collaboration/invite/[token]`,
  `/datahealth`, `/import-export`); decide keep/wire-up/remove per page.
- **Document the widget-catalog part-file sharding convention** — 4 sharded
  catalog files with no stated rule for which one a new entry belongs in.
- **Sync-worker test coverage** — currently zero.
- **Production deploy path for conversion service, sync-worker, and Go
  worker** — none currently exists; confirm whether these are meant to ship
  for V1 or are post-V1 infrastructure.
- **Existing lint/type debt** — 1,603 lint errors and 54 TypeScript errors
  across the repo as of the last `npm run check` snapshot (2026-08-09; see
  DEFINITION_OF_DONE.md for how new agent work should avoid adding to this
  without being blocked by it).
- **Reconcile the local prompt-queue workflow with the new GitHub-based
  one** — `docs/agents/workflow/GEMINI.md` describes a `docs/agents/prompts/`
  → `docs/agents/completions/` queue that this bootstrap's GitHub Issues
  system now supersedes for new work; the old queue's history stays as an
  archive (see AGENTS.md).

---

## 5. Post-V1

Explicitly later-stage scope per `VISION.md`'s own plan, or platform
expansion — don't pull these forward without a product reason:

- Stage 5 (automation of widget actions) and stage 6 (hyper-personalization)
  full rollout, beyond what's already built.
- Full stage-3 ML prediction coverage beyond the models that already exist.
- Web Extension ("Backpack/Handbag Mode"), Desktop app, Mobile app,
  downloadable CLI — `VISION.md` names these explicitly as future platforms;
  only the website is current focus.
- Advanced widget UI customization from `UI.md` not yet confirmed built:
  weave (merging same-class widgets), cropping, snap-rule variants (edge
  magnetism, smart alignment guides, proximity grouping).
- Real Go-worker implementation for cache/snapshot/event persistence, unless
  a concrete performance need pulls it forward.
- `#future-feature`-tagged items in FEATURE_LIST.md: `food-delivery`,
  `screen-viewer`, `live-resume`, `personal-documents`.

---

## 6. Technical debt

Only listed where it materially threatens V1 stability or agent velocity —
not a general cleanup wishlist.

- **`packages/{config,shared,ui}`** are empty placeholder packages (just a
  `package.json` each) not wired into any build. Either populate them or
  delete them — their presence currently implies infrastructure that
  doesn't exist.
- **Duplicated conversion-matrix logic** across `apps/web` and
  `services/conversion` (near-identical files, same unsanitized-HTML TODO in
  both) — a drift risk any time one copy is fixed and the other isn't.
- **Playwright `critical`/`performance`/`slow` tag-based projects** in
  `playwright.config.ts` have no matching spec files — dead configuration
  that implies coverage that doesn't exist.
- **Oversized files flagged by the smell report**: `DashboardRuntimeProvider.tsx`
  (921 lines, 513-line function), `ContextDiagramPage.tsx` (1029 lines),
  `CollaborationWorkspacePage.tsx` (862 lines, 639-line function) — worth
  breaking up opportunistically when touched, not as a standalone project.
- **`no-unsafe-*` ESLint findings** (~1,200 of the 1,603 current lint
  errors) represent real type-safety erosion despite a strict
  `tsconfig.base.json` — likely concentrated in a few files; worth a
  targeted pass rather than a blanket sweep.
