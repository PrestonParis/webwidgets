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

V2 automation status and the remaining implementation program are tracked in
[docs/finalization/V2_IMPLEMENTATION_STATUS.md](docs/finalization/V2_IMPLEMENTATION_STATUS.md).
The numbered V2 issues are delivery slices, not a completeness checklist.

**Stated target:** "Fully functional Website App V1" by **August 25, 2026**
(`VISION.md`). That date has passed. As of 2026-08-30, Prompts 001–018 are
implemented, and all three deployed Prompt 19 journeys passed on 2026-08-30.
The seven-day pilot, production worker/queue and alerting cutover, enforced
required checks, schema-history reconciliation, recovery exercise, and human
release-owner approval remain. The 2026-09-06 baseline found seven dead letters,
a 20-day-old queued job, seven degraded sources out of fifteen, and a deployed
migration absent from the release branch. Treat the release as `No Go` until
the remaining gates in §3 are closed.

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
- **Behind stage 1 in other places:** the breadth-first blueprint still does
  not define a release proof. Migration tracking and V1 credential isolation
  are reconciled, while the measured pilot and production operations cutover
  remain incomplete.

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

| System                                     | Maturity                  | Notes                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard / widget grid                    | working                   | Drag-and-drop, scenes, folders, adaptive runtime scheduler. Highest-churn area of the codebase.                                                                                                                                                                                                                                              |
| Widget registration pipeline               | working, fragile          | Functions, but requires 6 coordinated edits across 4 files per new widget — see ARCHITECTURE.md §4. High merge-conflict risk.                                                                                                                                                                                                                |
| Widget synthesis engine                    | partial                   | Fully built pipeline (intent → capability graph → assembly); real-world usage/coverage not verified in this audit.                                                                                                                                                                                                                           |
| View widget (file viewer)                  | working                   | Full parse/render/analyze/edit/export pipeline for 8+ formats.                                                                                                                                                                                                                                                                               |
| Inbox / email actions                      | working                   | Gmail-first and Outlook draft/send actions use exact-message approval, one-shot dispatch, reconciliation, and verified safe receipts. Provider write scopes require an explicit account upgrade; no autonomous send exists.                                                                                                                  |
| Calendar                                   | working                   | Google Calendar reads plus exact-approved create/cancel actions, deterministic provider IDs, all-day/timezone validation, guest-update disclosure, and provider read-back verification.                                                                                                                                                      |
| Finance                                    | working                   | Live quotes (Finnhub, CoinGecko); real-estate watchlist is a stub.                                                                                                                                                                                                                                                                           |
| Health tracking / recovery / habit         | working                   | Actively developed — these are the highest-churn feature areas in git history.                                                                                                                                                                                                                                                               |
| Chess                                      | working, suspended beta   | Lichess sync, PGN import, studies, and move trainer remain available to existing users but are outside V1 defaults and completion claims.                                                                                                                                                                                                    |
| Reading platform                           | working, suspended beta   | Bible/Quran/PDF via provider abstraction, annotations, and plans remain available to existing users but are outside V1 defaults and completion claims.                                                                                                                                                                                       |
| Creative Studio / Memorization             | working, suspended beta   | Existing widgets and data paths remain intact; both are excluded from V1 onboarding, generated workspaces, and automatic recommendations.                                                                                                                                                                                                    |
| Timeline Intelligence (`news`)             | working, bounded V1       | The command center and timeline render canonical events, source health, evidence-backed briefings, editable commitment candidates, exact-approved actions, and verified outcomes across the V1 loop.                                                                                                                                         |
| Context graph (`features/context/`)        | partial                   | ADR-009 defines it as a projection. The context substrate is now deployed, but rich-write behavior and projection integration still require end-to-end verification.                                                                                                                                                                         |
| Knowledge registry (`features/knowledge/`) | unknown                   | Owns user-authored durable content under ADR-009; functional depth remains unverified.                                                                                                                                                                                                                                                       |
| ML service                                 | working                   | FastAPI, model registry, drift monitor, 4-file pytest suite, 10 training scripts.                                                                                                                                                                                                                                                            |
| Go worker (cache/snapshot/events)          | broken                    | All 3 subsystems are stub no-ops (identical `// TODO: In future phases` markers). Nothing depends on it persisting data safely today.                                                                                                                                                                                                        |
| Conversion service                         | partial, suspended beta   | Functional locally via docker-compose; no production deploy path. Unsafe HTML-input routes are disabled, dependency audit is clean, and HTML output remains supported.                                                                                                                                                                       |
| V1 worker                                  | deployed for finalization | The free Render worker runs all four consumers, persists dependency heartbeats, reports durable queue/action/source health, and routes exact-approved actions with provider idempotency and receipts. Paid continuous compute and persistent queue delivery remain the production upgrade.                                                   |
| Onboarding                                 | working                   | Goal discovery, intent capture, widget selection, workspace generation — described as a finished pass.                                                                                                                                                                                                                                       |
| Admin panel                                | unknown                   | Feature-complete per FEATURE_LIST.md scope (users/flags/audit/metrics/ML/jobs); functional depth not verified.                                                                                                                                                                                                                               |
| Billing (Stripe)                           | working                   | Checkout, webhooks, customer portal present.                                                                                                                                                                                                                                                                                                 |
| Automation (stage 5)                       | working, bounded V1       | Four immutable V1 templates now cover commitment capture, daily briefings, calendar preparation, and stale-task review with dry-run, local-time scheduling, exact approval where state changes, replay protection, pause controls, and visible history/failures. n8n remains an optional allowlisted executor rather than the policy engine. |
| Personalization (stage 6)                  | partial                   | Cross-widget intelligence goals documented in PERSONALIZE.md; onboarding-time personalization exists; full cross-widget adaptation (e.g. "workout tracked → nutrition adjusts") not verified as implemented.                                                                                                                                 |
| ML predictions beyond email (stage 3)      | working foundation        | Governed Anthropic summarization, research synthesis, and commitment resolution are available with paid-tier, consent, schema, audit, cost, rate, evidence, and abstention controls. Briefings and candidate review now consume this boundary.                                                                                               |
| Widget-based actions (stage 4)             | partial                   | Email draft/send, Calendar create/cancel, local tasks, and configured workflow runs use canonical approval and receipts. Generate document, export data, and summarize file remain unverified.                                                                                                                                               |
| Security (stage 7)                         | working, bounded V1       | Prompt 18 closes known critical/high V1 findings: provider keys are server-only, metrics fail closed, unsafe HTML input is disabled, webhook secrets use constant-time comparison, and owner/action boundaries have automated evidence. Broader platform hardening remains post-pilot work.                                                  |
| Deployment (stage 8)                       | working (partially)       | Web deploys to Vercel and the V1 worker is deployed as a free Render web service with non-persistent Key Value. The paid worker/persistent queue production cutover, conversion, and Go remain without completed production paths.                                                                                                           |
| Schema/migration tracking                  | blocked by drift          | The 2026-09-06 linked check found deployed migration `202609030001`, while `origin/finalization` stops at `202608300005`. The only observed local copy is untracked and must be reviewed and versioned without changing the deployed migration identity.                                                                                     |
| CI                                         | working, unenforced       | `.github/workflows/ci.yml` reports changed-file lint/typecheck/tests/build. GitHub returned HTTP 403 when Prompt 19 inspected `main` protection because required checks are unavailable for this private repository on the current plan.                                                                                                     |
| Automated test coverage                    | release suite ready       | Broken npm targets and dead Playwright projects are removed. `test:v1` contains three production-like Chromium journeys; the seven-day pilot must record a passing deployed run.                                                                                                                                                             |
| Local commit-time quality gates            | broken                    | Husky is installed but no `.husky/pre-commit` script exists — nothing is actually enforced at commit time today.                                                                                                                                                                                                                             |

---

## 3. V1 required

Work that blocks calling WebWidgets a shippable V1, or blocks the agentic
workflow this bootstrap sets up from being trustworthy.

- **Enable GitHub required checks** — the workflow reports on every PR, but
  the private repository's current plan rejects branch-protection access.
  Upgrade GitHub or make the repository public, then require every job listed
  in `.github/workflows/README.md` before release.
- **Connect external alert delivery** — Prompt 18 provides durable telemetry,
  protected Prometheus metrics, thresholds, and tracked alert rules. Configure
  the scrape target and receiver before expanding beyond the staging pilot.
- **Complete Prompt 19 evidence** — preserve the passing deployed V1 journeys,
  then record seven consecutive qualifying pilot days against the frozen
  launch thresholds and obtain human release-owner approval.
- **Reconcile deployed schema history** — review and version the exact deployed
  `202609030001` migration. Do not start a release pilot from a branch that
  cannot reproduce the linked database.
- **Clear current automatic `No Go` operations signals** — the 2026-09-07
  00:15 UTC snapshot reported seven dead letters, a 1,725,311-second oldest
  queued job, and seven degraded sources out of fifteen. Reconcile effects and
  restore health before day 1.
- **Upgrade the smoke-tested worker topology before release** — ADR-015's free
  Render host is deployed and verified. Before production, cut over to
  ADR-014's continuous worker and persistent Key Value. The bounded Python
  inference host is selected but its free instance also needs a production
  availability upgrade.
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
- **Production deploy path for the conversion service** — it remains a
  specialized adapter whose V1 hosting requirement is not yet proven. The
  sync worker is V1-required; Go is explicitly deferred by ADR-011.
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
  `services/conversion` remains a drift risk. Prompt 18 disables HTML input in
  both copies and tests the server boundary, but the catalogs should eventually
  share one generated source.
- **Oversized files flagged by the smell report**: `DashboardRuntimeProvider.tsx`
  (921 lines, 513-line function), `ContextDiagramPage.tsx` (1029 lines),
  `CollaborationWorkspacePage.tsx` (862 lines, 639-line function) — worth
  breaking up opportunistically when touched, not as a standalone project.
- **`no-unsafe-*` ESLint findings** (~1,200 of the 1,603 current lint
  errors) represent real type-safety erosion despite a strict
  `tsconfig.base.json` — likely concentrated in a few files; worth a
  targeted pass rather than a blanket sweep.
