# V1 Finalization Prompt Queue

These prompts expand `docs/finalization/DELIVERY_PLAN.md` into reviewable
implementation tasks. They are not the historical prompt queue under
`docs/agents/prompts/`; new execution should still be tracked through GitHub
issues and one branch/PR per prompt unless a prompt explicitly says it is a
documentation-only checkpoint.

Before executing any prompt, read:

1. `/AGENTS.md`
2. `docs/finalization/prompts/000-MASTER-GUIDANCE.md`
3. the prompt itself and its listed prerequisites
4. the current versions of `ARCHITECTURE.md`, `ROADMAP.md`, and
   `docs/finalization/DECISIONS.md`

## Status values

- `Available`: prerequisites are satisfied and implementation may begin.
- `Blocked`: a prerequisite or human decision is outstanding.
- `Checkpoint`: produces a decision or audit rather than product code.
- `Awaiting approval`: the checkpoint deliverable exists, but its required
  human decision has not been recorded.
- `Complete`: acceptance criteria were verified and completion evidence was
  added to the source issue/PR.
- `Cutover pending`: implementation and schema are ready, but a live external
  service must be configured and verified before completion can be claimed.

The status inside each prompt is a planning default. Confirm current GitHub
issues and PRs before claiming ownership, especially around dashboard,
Supabase, timeline, action, and automation files.

## Ordered queue

| Prompt | Outcome                                          | Status    | Depends on        |
| ------ | ------------------------------------------------ | --------- | ----------------- |
| 001    | Enforce breadth freeze and suspended beta        | Complete  | —                 |
| 002    | Decide runtime and information ownership         | Complete  | —                 |
| 003    | Audit live schema and RLS                        | Complete  | Supabase access   |
| 004    | Add canonical timeline/action schema             | Complete  | 002, 003          |
| 005    | Deploy one durable worker runtime                | Complete  | 002, 004          |
| 006    | Persist RSS/Atom source ingestion                | Complete  | 004, 005          |
| 007    | Ingest email and calendar timeline events        | Complete  | 004, 005          |
| 008    | Ingest task, note, document, and activity events | Complete  | 004, 005          |
| 009    | Deliver timeline query and source-health UI      | Complete  | 006–008           |
| 010    | Implement governed LLM provider adapters         | Complete  | 002, 004          |
| 011    | Generate evidence-backed briefings               | Complete  | 009, 010          |
| 012    | Produce commitment candidate actions             | Complete  | 007, 010          |
| 013    | Execute and verify task actions                  | Complete  | 004, 005, 012     |
| 014    | Execute calendar, email draft/send, and workflows | Complete  | 005, 012          |
| 015    | Persist the automation state machine             | Complete  | 004, 013, 014     |
| 016    | Ship bounded automation templates                | Complete  | 011, 015          |
| 017    | Integrate the V1 command center                  | Ready     | 009, 011, 013–016 |
| 018    | Complete security and operational hardening      | Blocked   | 005–017           |
| 019    | Prove V1 journeys and release readiness          | Blocked   | 001–018           |

Prompts 006, 007, and 008 may run in parallel only when they do not edit the
same canonical schema or shared worker registry. Prompts 013 and 014 may run
in parallel after the action contracts are stable. Everything else should
follow the dependency order.

## Required completion handoff

Every prompt must finish with a handoff containing:

- outcome delivered in user terms;
- files and migrations changed;
- tests and checks actually run, with results;
- acceptance criteria demonstrated;
- security, data, deployment, and rollback notes;
- remaining blockers or follow-up issues;
- documentation and maturity ratings updated; and
- the next prompt whose prerequisites are now satisfied.

Do not mark a prompt complete when it only adds interfaces, placeholder data,
mock success, or an undispatched worker.
