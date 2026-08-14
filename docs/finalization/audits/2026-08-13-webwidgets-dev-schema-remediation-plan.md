# webwidgets-dev Schema Remediation Plan

Status: Proposed — no migration authorized or applied

Source audit:
[`2026-08-13-webwidgets-dev-schema-and-rls-audit.md`](2026-08-13-webwidgets-dev-schema-and-rls-audit.md)

Each item is a separate migration/review task. Ordering is mandatory unless a
security incident requires the P0 access-control migration to ship sooner.

## 1. P0 — Protect import/export job logs

Migration task: `secure_import_export_job_logs`

- Enable RLS on `export_job_logs` and `import_job_logs`.
- Add policies that authorize through the owning `export_jobs.user_id` or
  `import_jobs.user_id`.
- Reduce `anon` and `authenticated` grants to the minimum commands needed;
  explicitly remove broad maintenance/truncate privileges.
- Confirm background/admin writes use the intended server role.
- Add two-user select/insert/update/delete tests plus unauthenticated denial.

Dependency: none.

Rollback: restore the prior grants only during an emergency rollback; do not
disable RLS as the routine rollback.

Prompt impact: security remediation can precede the baseline if urgently
approved, but its SQL must be captured as a new tracked migration.

## 2. P0 — Move credentials behind a server-only boundary

Migration/design task: `isolate_provider_credentials`

- Inventory server consumers of credential fields in `profiles`,
  `user_tokens`, `user_email_accounts`, and `user_integration_keys` without
  reading or logging values.
- Choose one server-only encrypted store or Vault-backed pattern; do not create
  a second uncoordinated token system.
- Expose a safe non-secret connection/account projection for client reads.
- Revoke browser-selectable access to raw access tokens, refresh tokens, and
  provider/API keys. Preserve explicit user scoping in server and worker paths.
- Move the profile provider key into the selected model-key credential path.
- Plan credential rotation based on audit/access evidence.
- Add tests proving authenticated browser clients cannot select secret columns
  while server connector refresh still works for two distinct users.

Dependency: baseline recovery may run in parallel, but remote data migration
requires its own human-approved maintenance plan.

Rollback: retain encrypted old columns temporarily with server-only access
until provider refresh and rollback tests pass; never restore browser reads as
the rollback mechanism.

## 3. P0 — Recover and sanitize remote migration history

Repository task: `recover_remote_migration_history`

- Recover all 46 remote migrations into an isolated directory using the
  supported CLI fetch command.
- Compare filenames and checksums against the committed audit manifest.
- Review every SQL file for secrets, personal identifiers, destructive
  statements, role assumptions, and environment-specific seeds.
- Sanitize the two migrations flagged for email literals; preserve an audit
  note explaining intentional checksum differences.
- Commit reviewed files under their original versions without linking or
  pushing schema.
- Verify `supabase migration list` shows the 46 versions aligned remotely and
  the local context migration as the sole unapplied successor.

Dependency: ADR-012 approval.

Rollback: repository revert only; this task must not mutate remote schema or
migration history.

## 4. P1 — Reconcile the context substrate migration

Migration task: review existing `202605300001_context_substrate.sql`

- Diff the migration against verified legacy `context_entries` constraints,
  indexes, policies, and callers.
- Confirm its additive columns, indexes, tables, and RLS can apply after the
  recovered history without replacement or data loss.
- Test on an ephemeral database built from reviewed migrations.
- Add cross-user tests for entries, edges, permissions, and saved views.
- Verify both legacy reads and rich writes during cutover; remove compatibility
  fallback only in a later change after production evidence.

Dependency: task 3.

Rollback: additive forward repair or table-specific rollback tested against an
ephemeral copy; do not drop populated context columns remotely.

## 5. P1 — Reconcile activity projection schema

Migration/application task: `reconcile_activity_projection`

- Decide which current activity fields remain necessary for the UI projection
  under ADR-009.
- Add only projection fields still required, or narrow callers before schema
  change. Do not make activity the canonical timeline.
- Add origin markers and loop-prevention constraints needed by Prompt 008.
- Preserve current user isolation and document 30/90-day projection retention.
- Test publish, list, search, archive, maintenance, and two-user isolation.

Dependency: task 3 and accepted Prompt 004 contracts.

Rollback: additive columns may remain unused; avoid destructive column removal
in the initial reconciliation.

## 6. P1 — Resolve stale application table names

Application/schema tasks, one feature per PR:

- `journal_entries`: map the on-this-day/context producer to canonical
  `journals` if semantics match; do not create a duplicate journal table.
- `user_files`: map file resolvers to `file_uploads`/document records if that is
  the intended source; do not create a parallel file ledger.
- `context_edges`, `context_permissions`, `context_saved_views`: resolved by
  the reviewed context migration, not ad hoc table creation.
- `custom_widgets` and `fitness_workout_routines`: defer with non-V1 breadth or
  remove stale queries; do not pull them into Prompt 004.

Dependency: task 4 for context; otherwise independent after table ownership is
confirmed.

Rollback: revert each isolated application change.

## 7. P1 — Implement canonical V1 lifecycle schema

Migration task: Prompt 004

- Add source/cursor health, minimized raw observation, timeline event, insight,
  candidate, immutable approval, idempotency, verified outcome, retention, and
  deletion relations required by ADR-009/010.
- Reuse/evolve `integration_connections`, `jobs`, `action_requests`,
  `action_results`, and automation records where live constraints allow.
- Include RLS, indexes, constraints, two-user tests, and rollback limitations
  in the same focused migration set.

Dependency: tasks 1, 3, and 4; coordinate task 2 credential contracts.

Rollback: additive forward repair; no historical data rewrite without separate
approval.

## 8. P2 — Clarify feedback and duplicate policies

Migration task: `clarify_feedback_and_policy_duplicates`

- Decide whether `user_feedback` is direct authenticated insert, API-only, or
  service-only; add one explicit policy matching that decision.
- Consolidate duplicate `profiles` select and `audit_events` owner policies
  after verifying no role/command difference.
- Review intentionally public/shared `currency_rates` and nullable-owner
  `reading_documents` policies; document that they are deliberate rather than
  accidental omissions.

Dependency: task 3.

Rollback: restore the prior policy set from the schema-only pre-change dump.

## 9. Regenerate canonical types

Repository task: `regenerate_supabase_types`

- Generate `public,graphql_public` types from the reconciled live project.
- Review all table, column, relationship, function, enum, and PostgREST-version
  changes.
- Run targeted TypeScript checks for every consumer affected by removed or
  newly typed tables.
- Commit the generated file only when it matches both migration history and
  deployed schema.

Dependency: tasks 1, 3, 4, and any schema portion of task 7 included in the
same release.

Rollback: repository revert; never hand-edit generated types to disguise live
drift.
