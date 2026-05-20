# AGENTS.md - Project Instructions

Read this file before thinking about any task.

## Linting Compliance (`npm run check`)

All code must pass `npm run check` clean. The check enforces:

- **File size** — ≤300 lines per file, ≤12 exports per file
- **Function size** — ≤100 lines per function/component body (end line − start line)
- **Hook count** — ≤6 `use[A-Z]*` calls per `.tsx` file, counted across the **entire file** (all components combined). Files in `/hooks/` are exempt.
- **TypeScript** — Zero type errors. No `any`. Use `exactOptionalPropertyTypes` — spread optional props conditionally: `...(prop && { prop })` not `{ prop }` when prop may be undefined.
- **ESLint** — Zero violations. No `eslint-disable` directives ever. Refactor instead.
- **No inline SVG** outside `/icons/` — move to an icon component.
- **No direct `fetch('/api/...')` in components** — centralise in an API service module.

### Strategies for compliance

**Reducing hook count in `.tsx` files:**
Move hook calls to a `.ts` custom hook in `/hooks/`. Sub-components in the same `.tsx` file all count toward the file total. If a file has multiple components each calling 2–3 hooks, extract them all into one custom hook.

**Reducing function size:**

- Extract internal sub-components (e.g. `SaveRow`, `SceneList`, `FolderNameSection`)
- Extract file-level helper functions outside the component
- Extract complex derived values into named variables

**Reducing file size / export count:**

- Split large files. Move constants to a `*Config.ts` file, types to a `*types.ts` file.
- Make helpers file-internal (no export) if only used within the file.

**State-during-render pattern** (approved React alternative to `setState` in useEffect):

```ts
const [prev, setPrev] = useState(val);
if (val !== prev) { setPrev(val); setDerived(...); }
```

## Coding Standards

- **No `eslint-disable`** — Never disable linting rules. Refactor the code to fix the underlying issue.
- **Strict TypeScript** — Always use precise types. Avoid `any` at all costs.
- **Naming** — PascalCase for React components, camelCase for utilities and hooks.
- **No comments explaining what code does** — only add comments when the WHY is non-obvious.
- **No backwards-compatibility shims** — if something is unused, delete it.

## Tech Stack Specifics

- **Next.js** — Use App Router patterns and Server Components by default.
- **State Management** — Use modular patterns for widgets to keep them self-contained.
- **ML service** — Python FastAPI deployed to Vercel as a separate project (root: `ml_service/`). The main Next.js app reaches it via `ML_SERVICE_URL`. All routes fall back gracefully when the service is unreachable.

## Workflow

- Don't use dynamic issues like `const { getLogger } = await import('./lib/observability/logger');`
- Run `npm run check` after any substantial code change to verify compliance.
- Scope checks to a folder with `npm run check features/dashboard` to get faster feedback.
