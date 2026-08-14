# 000 — Master Guidance for V1 Finalization Prompts

Status: Reference  
Assigned agent: N/A  
Priority: Critical

## Mission

Finish the smallest trustworthy version of WebWidgets that continuously
collects authorized signals, presents an evidence-backed timeline and
briefing, proposes useful work, completes approved basic actions, and records
the outcome.

## Operating rules

- Inspect before editing. Use `rg` to locate current implementations and do
  not assume paths in a prompt are still exact.
- Preserve feature boundaries and reuse existing connectors, schemas, UI,
  logging, consent, and Supabase patterns.
- Work on a task branch, never directly on `main`, and do not merge your own
  PR.
- Keep each prompt to one focused PR. If the discovered scope is materially
  larger, stop and propose decomposition.
- Do not add new product breadth while finalization is active.
- Do not run `npm run build` locally. Use targeted checks and tests; CI owns
  the build.
- Any changed file must meet the repository lint, type, size, hook, and
  testing rules in `AGENTS.md` and `DEFINITION_OF_DONE.md`.
- Any schema change requires a tracked migration and same-migration RLS for
  user data.
- Never use the service-role client as a shortcut around user scoping.
- Never expose or print secrets, tokens, source message bodies, or private
  document content in logs, tests, reports, or PR descriptions.

## Definition of real implementation

A capability is not working merely because it has:

- a component or route;
- a registry entry;
- a Zod schema;
- a training script;
- an enqueue call;
- a worker factory that is never started;
- a resolved promise returning an empty collection; or
- a placeholder handler returning success.

A V1 capability must operate against persisted user-scoped state, expose
failure, pass its acceptance tests, and have a deployment/runtime path.

## Required system properties

### Provenance

Every derived insight and candidate action links to its source timeline
events. Store rule/model versions, confidence, creation time, and expiration
where relevant.

### Idempotency

Source redelivery, job retry, webhook retry, page refresh, and double approval
must not duplicate timeline records or provider-side actions.

### Bounded intelligence

Deterministic policy controls permissions, consent, dates, approval, and
execution. Models may classify, rank, summarize, and propose typed payloads;
they may not grant themselves permission or alter policy.

### Honest failure

Unavailable providers and incomplete paths return explicit typed failures.
Never preserve a fake-success behavior for UI convenience.

### User control

State changes require approval unless the exact low-risk automation and
payload class were explicitly enabled. Users can inspect, edit, dismiss,
pause, disconnect, and delete where the V1 contract promises it.

## Testing expectations

- Unit tests for normalization, scoring, policy, state transitions, and other
  business logic.
- Integration tests for routes, Supabase/RLS-sensitive queries, workers,
  provider adapters, and action verification.
- E2E tests only for the three V1 journeys, added in Prompt 019 or earlier
  when a critical journey changes.
- Test duplicate delivery, stale data, revoked consent, provider failure,
  retry, malicious external content, and cross-user isolation where relevant.

## Documentation expectations

Update:

- `ARCHITECTURE.md` for changed topology, ownership, or flows;
- `ROADMAP.md` when maturity changes;
- `docs/agents/workflow/DECISIONS.md` for architecture decisions;
- `docs/finalization/DECISIONS.md` for V1 scope decisions; and
- affected finalization prompts if implementation changes a later prompt’s
  assumptions.

## Mandatory stop conditions

Stop and request human direction when:

- a live schema or RLS policy cannot be verified safely;
- runtime ownership or context/knowledge/timeline ownership remains disputed;
- an existing intentional behavior conflicts with V1 acceptance criteria;
- a security-sensitive choice lacks precedent;
- implementation would require a destructive migration or data rewrite not
  explicitly approved; or
- another active PR substantially overlaps the same subsystem.

## Final response format

Lead with the working user outcome. Then report verification, material design
decisions, known limitations, migrations/deployment needs, and the next
unblocked prompt. Do not claim success based only on code presence.
