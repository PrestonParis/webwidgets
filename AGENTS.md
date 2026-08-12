# AGENTS.md — WebWidgets Agent Instructions

Read this file before starting any task. It is the single canonical
instruction document for coding agents (Claude, Codex, Copilot) working on
WebWidgets, whether assigned via a GitHub issue or run directly. It merges
and supersedes the former `docs/agents/workflow/AGENTS.md` and
`docs/agents/workflow/CODEX.md` (both now point here) and reconciles the
workflow described in `docs/agents/workflow/GEMINI.md` with the GitHub-based
process this repo now uses for new work — see §11.

Companion docs: [ARCHITECTURE.md](ARCHITECTURE.md) (what exists and how it
fits together), [ROADMAP.md](ROADMAP.md) (what's next, by priority),
[DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md) (the bar a PR is judged
against).

---

## 1. Repository overview

WebWidgets is a personal-productivity dashboard: Next.js (App Router) +
Supabase, with a Python ML sidecar, a Go background worker, and a standalone
file-conversion service. Not an npm workspace monorepo — each
`apps/web` / `services/*` directory is independently managed. Full detail in
ARCHITECTURE.md.

```
apps/web/             Next.js app — the product surface
services/ml_service/  Python FastAPI — classification, suggestions, extraction
services/sync-worker/ Node/TS background sync worker
services/conversion/  File-conversion pipeline (own npm workspace)
services/go_services/worker/  Go worker — cache/snapshot/event infra (currently stubbed)
packages/{config,shared,ui}/  Empty placeholders — see §8
supabase/migrations/  Schema migrations (currently only 1 tracked file — see §6)
```

---

## 2. Commands

Run from repo root unless noted.

| Purpose | Command |
|---|---|
| Install | `npm install` (root), and separately inside `services/conversion`, `services/sync-worker` if touching those |
| Dev (web only) | `npm run dev` |
| Dev (web + API + sync, needs Docker) | `npm run dev:full` |
| Dev (ML service) | `npm run dev:ml` |
| Build | `npm run build` — **CI-only, do not run locally** (see §7) |
| Lint + typecheck + smells + stats | `npm run check` — scope it: `npm run check features/dashboard` |
| Lint only | `npm run linting:lint` |
| Typecheck only | `npm run linting:ts` |
| Format | `npm run format` / `npm run format:check` |
| Unit tests | `npm run test` (Vitest, `tests/**/*.test.ts`) |
| E2E tests | `npm run test:e2e` (Playwright) — see DEFINITION_OF_DONE.md §3 for which `test:*` scripts actually work |
| Python (ML service) | `npm run py:check` (format+lint+typecheck+security+deps+deadcode+smells+test), `npm run py:test` |

---

## 3. Linting compliance (`npm run check`)

All code must pass `npm run check` clean **for the files you touch or
create** (see DEFINITION_OF_DONE.md §2 for the "new errors, not total
errors" policy — the repo has pre-existing debt that isn't your PR's job to
fix). The check enforces:

- **File size** — ≤300 lines per file, ≤12 exports per file
- **Function size** — ≤100 lines per function/component body
- **Hook count** — ≤6 `use[A-Z]*` calls per `.tsx` file, counted across the
  entire file (all components combined). Files in `/hooks/` are exempt.
- **TypeScript** — zero type errors, no `any`, `exactOptionalPropertyTypes`
  — spread optional props conditionally: `...(prop && { prop })`, not
  `{ prop }` when `prop` may be `undefined`.
- **ESLint** — zero violations, **no `eslint-disable` directives ever**.
  Refactor instead.
- **No inline SVG** outside `/icons/` — move to an icon component.
- **No direct `fetch('/api/...')`** in components — centralize in an API
  service module.

**Reducing hook count in `.tsx` files:** move hook calls into a `.ts` custom
hook in `/hooks/`. Sub-components in the same file all count toward the
file total — extract them into one custom hook if several call 2–3 hooks
each.

**Reducing function size:** extract internal sub-components, extract
file-level helper functions, extract complex derived values into named
variables.

**Reducing file size / export count:** split large files; move constants to
`*Config.ts`, types to `*types.ts`; make helpers file-internal (no export)
if only used within the file.

**State-during-render pattern** (approved alternative to `setState` in
`useEffect`):

```ts
const [prev, setPrev] = useState(val);
if (val !== prev) { setPrev(val); setDerived(...); }
```

---

## 4. Coding conventions

- **Naming** — PascalCase for React components, camelCase for utilities and
  hooks.
- **Comments** — no comments explaining *what* code does; only add one when
  the *why* is non-obvious (a hidden constraint, a workaround, a subtle
  invariant).
- **No backwards-compatibility shims** — if something is unused, delete it.
- **Next.js** — App Router patterns, Server Components by default.
- **`page.tsx`** stays minimal — only routes to the full page component
  inside `features/`. No business logic, heavy layout, or API logic
  directly in route files.
- **`route.ts`** reuses existing handlers/utilities; no duplicated API
  logic.
- **No dynamic imports for standard modules** — don't write
  `const { getLogger } = await import('./lib/observability/logger')`.
- Search before creating: `rg` for existing components/hooks/types/utilities
  before writing new ones (`rg "WidgetShell"`, `rg "useModal"`, `rg "cn("`,
  etc.). Reuse before creating — this codebase has 65+ features and a
  utility you need very likely already exists.

---

## 5. Architectural boundaries

- **`features/<x>/` never imports from `features/<y>/`** (ADR-004). Shared
  code goes in `lib/`. Some utility duplication across features is an
  accepted tradeoff — extract to `lib/` only once a pattern repeats in 3+
  features.
- Within a feature: `components/`, `lib/`, `api/`, `types/`, `constants.ts`.
  New features go in `features/<feature_name>/` or
  `features/<feature_name>/<subfeature_name>/`.
- Before creating new UI, inspect similar widgets/pages for spacing, card,
  modal, button, and typography patterns already in use — consistency over
  novelty.
- Full system map, data flows, and the 4 architectural ambiguities that are
  still genuinely unresolved (context vs. knowledge, widget vs. Go-worker
  vs. import-export ownership, etc.) are in ARCHITECTURE.md §11. Don't
  silently pick an interpretation in those areas — stop and ask, or scope
  the task narrower.

---

## 6. Data access, Supabase, and RLS

- The Supabase **admin/service-role client is confined to `/app/api/**`
  server routes only** (ADR-005). It bypasses RLS entirely — never expose
  it client-side, never import it into a component or a shared client-safe
  module.
- All client-side reads go through the anon key and RLS policies.
- **Only one migration is currently tracked** in `supabase/migrations/`;
  most of the live schema predates migration tracking (ARCHITECTURE.md §8).
  Do not treat the migrations directory as ground truth for what exists —
  verify against generated types (`supabase gen types typescript`) when you
  need the real current schema.
- **Any schema change you make must land as a new tracked migration**
  (`supabase/migrations/YYYYMMDDHHMM_description.sql`), regardless of how
  the rest of the schema got there.
- **Any new or changed table holding user data needs RLS policies in the
  same migration** — not a follow-up PR. If a table is intentionally
  public/shared (e.g. `reading_documents` with `NULL user_id`), say so
  explicitly in the PR.

---

## 7. API validation and backend conventions

- Validate all API route inputs before use — the conversion service and
  sync-worker already use `zod` for this; follow the same pattern in
  `apps/web/app/api/**` where request bodies/query params are consumed.
- Reuse existing service/adapter patterns before writing a new external-API
  client — check `lib/connectors/` first.
- Do not run `npm run build`, keep dev servers running, or run watchers as
  part of a task unless the task specifically requires it — RAM is
  constrained on agent machines. Prefer static inspection, `rg`, targeted
  reads, targeted edits, and scoped `npm run check`.

---

## 8. Shared packages and cross-cutting code

- `lib/` is the only sanctioned home for cross-feature shared code.
  `lib/supabase/` (~215 importers) and `apps/web/features/dashboard/types/dashboard.ts`
  (the `WidgetType` union, ~60 importers) are the two highest fan-in points
  in the codebase — treat any change there as high-risk, keep it minimal,
  and call it out explicitly in the PR.
- **`packages/{config,shared,ui}` are empty placeholders** — `package.json`
  only, no source, not wired into any build. Do not assume they're a real
  shared-package system; don't add code there without first confirming
  (with a human, if unclear) that wiring them up is actually in scope.
- Widget registration (ARCHITECTURE.md §4) touches 4 files across ~6 edit
  sites. Scope this to **one widget per PR** unless the source issue
  explicitly bundles more — this is the single highest merge-conflict
  surface in the repo.

---

## 9. Secrets

- Never commit `.env.local` or any file containing real credentials.
  `.env.example` is the only env file that should carry committed content,
  and it must never contain real values.
- Never point `npm run env:cloud` at the production Supabase project —
  cloud-mode local dev uses a separate dev project; production credentials
  live only in Vercel env vars.
- Never put a live Stripe key (`sk_live_*`) in any local file — local/dev
  config uses `sk_test_*` placeholders only.
- Never echo secrets, tokens, or API keys into logs, error messages, or PR
  descriptions.

---

## 10. Testing, documentation, and PR expectations

Full detail in DEFINITION_OF_DONE.md — summary:

- Add/update unit tests for behavioral changes; integration tests when a
  real boundary (API route, RLS-sensitive query, external adapter) is
  touched; E2E tests only for critical journeys (auth, workspace/dashboard
  creation, widget render/persist, file upload/view, context recall,
  integration connect).
- Never weaken, skip, or delete a test to make CI pass.
- Never silently change product requirements — if an acceptance criterion
  can't be met as written, say so in the PR instead of quietly narrowing
  scope.
- Update ARCHITECTURE.md, ROADMAP.md, or `docs/agents/workflow/DECISIONS.md`
  when the change alters something those files describe.
- One branch per task, named for the issue (e.g. `agent/claude/123-fix-x`).
  Never commit directly to `main`.
- Small, focused PRs. No unrelated changes riding along with a fix or
  feature.
- **No agent merges its own PR.** Merge requires review by a human, or by an
  agent other than the one that authored the PR, and the PR must meet
  DEFINITION_OF_DONE.md. A formal cross-agent review assignment (which
  agent reviews which) is not yet defined in canonical docs — until it is,
  default to "not the author" and note who reviewed in the PR.

---

## 11. Relationship to the pre-existing local agent workflow

`docs/agents/workflow/GEMINI.md` describes an earlier local workflow: a
prompt queue in `docs/agents/prompts/`, completed work moved to
`docs/agents/completions/`, ad hoc issues logged in `docs/agents/issues/`.
**GitHub Issues and Projects now serve as the coordination layer for new
work** — don't file new work into `docs/agents/prompts/` or
`docs/agents/issues/PROBLEMS.md`; open a GitHub issue instead. The existing
contents of those directories remain as a historical record of Stage-1 work
and are safe to reference for context, just not to append to.

Two files from that workflow remain live and should keep being used:

- **`docs/agents/workflow/DECISIONS.md`** — the ADR log (ADR-001 through
  ADR-007 today). Keep adding entries here for architecture-level decisions;
  see §10.
- **`docs/agents/workflow/CLI.md`** — a living command cheatsheet. Add
  useful commands you discover (vercel/stripe/supabase/gh/rg patterns).

---

## 12. Prohibited behavior

- No `eslint-disable` directives.
- No unrelated refactors riding along with a scoped task.
- No weakening or deleting tests to make CI green.
- No silent product-requirement changes.
- No direct commits to `main`.
- No merging your own PR.
- No exposing the Supabase service-role client outside `/app/api/**`.
- No schema changes without a tracked migration + RLS policies.
- No `npm run build` or persistent dev servers/watchers as part of routine
  task execution.
- No touching `packages/{config,shared,ui}` as if they were live shared
  infrastructure without confirming that's actually in scope.

---

## 13. When to stop and request human input

Stop and ask (or flag clearly in the PR/issue and wait) rather than
guessing when you hit:

- One of the architectural ambiguities listed in ARCHITECTURE.md §11
  (context vs. knowledge boundary, widget/Go-worker/import-export/runtime
  ownership, ML service deploy target).
- A schema change that touches a table without any existing RLS precedent
  to follow.
- An acceptance criterion that conflicts with existing, seemingly
  intentional behavior in the code.
- A task that would require touching `lib/supabase/` or
  `features/dashboard/types/dashboard.ts` in a way that isn't narrowly
  additive.
- A task whose scope, once you're inside the code, turns out to be
  materially larger than the issue implied (should be decomposed, not
  absorbed into one big PR).
- Anything security- or secrets-adjacent where the correct behavior isn't
  already established by an existing ADR or pattern.

---

## 14. Agent assignment heuristics (canonical)

This is the single canonical version of these rules — nothing else in the
repo should maintain a separate copy. When triaging or picking up a GitHub
issue, use this to decide which agent it's suited for. These are defaults,
not laws: **avoiding overlapping ownership matters more than matching the
"right" agent** — see §14.4.

### 14.1 Claude

**Prefer for:** architecture, difficult debugging, cross-service behavior,
the context engine, the widget runtime/synthesis engine, database/security/
RLS issues, broad refactors, ambiguous high-reasoning tasks.

**Known weaknesses to actively guard against:** over-abstracting too early,
changing behavior unintentionally while "just" restructuring, leaving edge
cases unfinished, forgetting existing patterns and creating duplicate
utilities, breaking loading states, missing null/undefined handling,
incompletely wiring event/state flows.

**Before completing any task, verify:**
- *Structure* — correct folder placement, correct feature boundaries, no
  duplicate components/utilities.
- *Types* — align with existing usage, no unnecessary `any`, props stay
  compatible.
- *Functionality* — loading/empty/error states still work, actions still
  fire, forms still submit, dialogs still open/close, existing workflows
  still function.
- *UI* — no broken layouts, no accidental spacing regressions, dark mode
  and responsive behavior preserved.
- *Accessibility* — keyboard navigation, aria labels, focus handling, and
  button accessibility all intact.

### 14.2 Codex

**Prefer for:** well-bounded feature implementation, API endpoints,
integrations, adapters, migrations with clear requirements, isolated
frontend/backend features, testable implementation tasks.

**Operating priorities:** follow existing design patterns first — inspect
before creating; new abstractions only when duplication is already
significant or the existing pattern is provably insufficient. Prioritize
integration quality and architectural consistency over novelty. `rg`
aggressively before writing anything new.

**Before completing any task, verify:** folder placement, import
correctness, naming consistency, type alignment with existing systems, no
duplicate utilities introduced, styling matches surrounding UI, APIs remain
coherent.

### 14.3 Copilot

**Prefer for:** small, well-isolated bugs; tests; documentation;
accessibility fixes; lint/type cleanup; straightforward UI fixes; scoped
technical debt; dependency maintenance.

Not the right choice for anything requiring cross-service reasoning,
ambiguous scope, or judgment calls about product behavior — route those to
Claude or a human instead.

### 14.4 Avoiding overlapping ownership

More important than picking the "right" model is making sure **two active
agents are never making substantial changes to the same subsystem at the
same time.** Before assigning or picking up a task:

- Check GitHub for other open PRs or in-progress branches touching the same
  feature directory or one of the high-fan-in files (`lib/supabase/`,
  `features/dashboard/types/dashboard.ts`,
  `features/dashboard/lib/renderWidgetContent.tsx`,
  `features/platform/lib/dashboardWidgetLibrary.ts`,
  `features/search/lib/widgetCatalog*.ts`).
- If two tasks would touch the same file, serialize them (one waits) rather
  than running them concurrently, even if they're otherwise independent.
- Widget-registration tasks are one-widget-per-PR by default (§8).
- When a task's issue doesn't make ownership obvious, prefer the smaller,
  more narrowly-scoped interpretation and flag the rest as a follow-up
  issue rather than expanding scope to "finish it properly."
