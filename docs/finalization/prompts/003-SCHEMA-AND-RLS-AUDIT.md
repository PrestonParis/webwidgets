# 003 — Establish the Live Schema Baseline and RLS Audit

Status: Awaiting approval

Priority: Critical  
Depends on: Authenticated access to the intended Supabase project

## Project identity confirmed (2026-08-13)

The project owner confirmed `webwidgets-dev` (`cvroudtyxsgllivlrayu`) is the
intended WebWidgets database. The former `ai-dash` project no longer exists.
`worldview` is a separate future integration and was not inspected.

The read-only audit used the confirmed project ref without linking, pushing,
applying migrations, or reading table rows.

## Objective

Create a safe, evidence-based baseline of the live schema and determine the
actual RLS posture of every table needed by V1. This is an audit and baseline
task, not authorization for destructive reconciliation.

## Required investigation

- Confirm the intended Supabase project reference before reading or changing
  schema.
- Generate current TypeScript types and obtain schema/policy metadata through
  supported Supabase tooling.
- Compare live schema, generated types, repository migrations, and application
  queries.
- Inventory V1 tables used by auth/profile, integrations/tokens, email,
  calendar, tasks, notes/documents, activity, context/knowledge, news/events,
  jobs, actions, automation, consent, and audit logging.
- Identify tables with RLS disabled, incomplete policies, service-role-only
  assumptions, missing ownership columns, or ambiguous shared/public rows.

## Required deliverables

- A dated audit report under `docs/finalization/audits/` containing no secret
  values or private user data.
- A machine-readable or clearly structured table inventory: table, owner
  column, RLS status, policies, V1 consumer, migration coverage, risk, and
  proposed remediation.
- A safe baseline strategy: schema-only migration baseline, documented dump,
  or another Supabase-supported approach that will not recreate live objects.
- Separate migration tasks for remediation, ordered by dependency and risk.
- Regenerated types only if the diff is reviewed and appropriate to commit.

## Safety constraints

- Do not reset, link to a different project, push schema, apply migrations,
  delete data, or expose policy expressions containing sensitive values.
- Do not infer policy correctness from table names.
- Do not use admin-client success as evidence that RLS works.
- If authentication or project identity is uncertain, stop and request user
  confirmation.

## Acceptance criteria

- The V1 schema inventory is complete enough to plan Prompt 004.
- Cross-user isolation risks are explicitly identified.
- The baseline approach has rollback/recovery notes and human approval.
- No production data or schema was mutated during the audit.
- `ARCHITECTURE.md` and `ROADMAP.md` reflect verified facts, not assumptions.

## Audit deliverables

- Dated report:
  `docs/finalization/audits/2026-08-13-webwidgets-dev-schema-and-rls-audit.md`
- Complete structured inventory:
  `docs/finalization/audits/2026-08-13-webwidgets-dev-schema-inventory.json`
- Remote migration checksum/privacy manifest:
  `docs/finalization/audits/2026-08-13-webwidgets-dev-remote-migration-manifest.json`
- Ordered remediation tasks:
  `docs/finalization/audits/2026-08-13-webwidgets-dev-schema-remediation-plan.md`
- Proposed baseline decision: ADR-012

The audit and remediation plan are complete. Prompt 003 remains Awaiting
approval until the project owner accepts or revises ADR-012's recovered-history
baseline strategy. No generated types were committed because doing so before
schema reconciliation would remove context contracts used by current code.
