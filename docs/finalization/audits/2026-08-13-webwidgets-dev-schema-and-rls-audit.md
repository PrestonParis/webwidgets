# webwidgets-dev Live Schema and RLS Audit

Status: Complete — baseline strategy approved 2026-08-14

Date: 2026-08-13

Project: `webwidgets-dev`

Project ref: `cvroudtyxsgllivlrayu`

Scope: schema and policy metadata only; no table rows or private user content

## Outcome

The intended WebWidgets database is confirmed and readable. The schema is not
safe to treat as migration-backed or type-synchronized yet:

- 107 live `public` tables exist; 105 have RLS enabled and 153 policies exist.
- `export_job_logs` and `import_job_logs` have RLS disabled while `anon` and
  `authenticated` have table privileges. Their parent jobs are user-owned, so
  the child logs create a cross-user access risk.
- `user_feedback` has RLS enabled but no policy. It is fail-closed for ordinary
  clients, which is safer than exposure but likely breaks the intended form.
- Four user-readable tables contain credential fields:
  `profiles`, `user_tokens`, `user_email_accounts`, and
  `user_integration_keys`. RLS isolates users from each other, but does not
  prevent the user's browser session from selecting its own raw credentials.
- At audit time, remote history contained 46 migrations absent from the
  repository. They were recovered and privacy-reviewed on 2026-08-14 after
  ADR-012 approval. `202605300001` remains the sole local-only successor and
  its context schema is not present live.
- Current code contains literal queries to seven tables absent from live:
  `context_edges`, `context_permissions`, `context_saved_views`,
  `custom_widgets`, `fitness_workout_routines`, `journal_entries`, and
  `user_files`.
- Committed Supabase types contain 84 live-table definitions; the live schema
  contains 107. Twenty-six live tables are missing from committed types, three
  context tables exist only in committed types, and six shared tables have
  column drift.
- V1 has no persisted source, raw-observation, canonical timeline, insight, or
  candidate-action tables. Prompt 004 still needs to add the accepted model
  after baseline and security remediation.

This audit made no remote changes, did not link the repository, did not read
rows, and did not commit raw schema SQL or live credentials.

## Evidence and reproducibility

Read-only Supabase CLI operations used the explicitly confirmed project ref:

```text
supabase projects list --output json
supabase gen types typescript --project-id <confirmed-ref> --schema public
supabase db dump --project-ref <confirmed-ref> --schema public --file <temp-file>
supabase migration list --project-ref <confirmed-ref>
supabase migration fetch --project-ref <confirmed-ref> --workdir <isolated-temp-dir>
```

The schema-only dump contained no rows. It was retained only in a temporary
directory for this audit and had SHA-256
`92e6f815de5abe0d77248fcbcc85fe49397dd85cd0c465c63c217d9b8108ee09`.
The temporary public-schema type generation had SHA-256
`379535ee81436eb1c9686908a68dff27e4b3c18a4fc23b1181a3b9375b93b8d4`.

The complete structured inventory is
[`2026-08-13-webwidgets-dev-schema-inventory.json`](2026-08-13-webwidgets-dev-schema-inventory.json).
It records every live table plus every literal application table reference
missing from live, including owner columns, RLS status, policy names/commands,
V1 consumer, code references, type/migration coverage, risk, and proposed
remediation.

The 46 recoverable remote migration filenames, sizes, and checksums are in
[`2026-08-13-webwidgets-dev-remote-migration-manifest.json`](2026-08-13-webwidgets-dev-remote-migration-manifest.json).
Two recovered migrations contain email literals and must be sanitized before
any historical SQL is committed. No secret-key pattern was found by the
metadata scan, but manual review remains required.

## V1 table inventory summary

The JSON inventory is authoritative for individual tables. This matrix groups
the 48 tables currently relevant to V1 planning.

| V1 area                    | Live records                                                                                                | Ownership / RLS                         | Finding                                                                                                                                |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Auth and profile           | `profiles`, `onboarding_profiles`                                                                           | `profiles.id` or `user_id`; RLS on      | `profiles` contains a provider API-key column and duplicate select policies; live has two columns absent from committed types          |
| Dashboard / command center | `dashboard_layouts`, `widget_settings`, `widget_instances`, `user_preferences`, `feature_settings`          | `user_id`; RLS owner policies           | Structurally isolated; historical migration coverage was recovered on 2026-08-14                                                      |
| Integrations / tokens      | `integration_connections`, `user_tokens`, `user_email_accounts`, `user_integration_keys`, `user_model_keys` | `user_id`; RLS owner policies           | Three tables expose raw credential columns to an owner's authenticated session; `user_email_accounts` is missing from committed types  |
| Email ingestion            | `email_queue`, `email_snapshots`, `email_processing_log`, `email_classifications`                           | `user_id`; RLS on                       | Queue is explicit service-only; snapshots are owner-selectable and include body text; three tables are missing from committed types    |
| Legacy email candidates    | `email_actions`                                                                                             | `user_id`; owner policy                 | Live and used but absent from committed types; must converge with canonical candidates/actions rather than remain a separate lifecycle |
| Calendar                   | No canonical event table                                                                                    | Provider/API scoped                     | V1 normalization must use source references and the new timeline model; do not invent another provider sync store in Prompt 007        |
| Tasks                      | `todos`                                                                                                     | `user_id`; owner policy                 | Structurally isolated and present in committed types; task schema is minimal                                                           |
| Notes / knowledge          | `journals`, `quick_notes`, `knowledge_items`                                                                | `user_id`; owner policies               | Code also queries missing `journal_entries`; map to the canonical journal table before timeline ingestion                              |
| Documents / files          | `documents`, `artifacts`, `file_uploads`, `file_folders`, `file_metadata`, `file_text_extractions`          | `user_id`; owner policies               | Five live tables are missing from committed types; code also queries missing `user_files`                                              |
| Activity / notifications   | `activity_events`, `notifications`                                                                          | `user_id`; owner policies               | Activity code expects 11+ columns absent live; notifications is absent from committed types                                            |
| Context                    | `context_entries` only                                                                                      | `user_id`; owner policy                 | Live is legacy shape. The tracked migration and committed types expect added fields plus three tables that are not live                |
| Jobs                       | `jobs`, `job_steps`, `job_logs`, `job_artifacts`                                                            | direct `user_id` or parent-job policy   | RLS structure is suitable to evolve; status/idempotency/retention contracts still need Prompt 004                                      |
| Actions                    | `action_requests`, `action_results`                                                                         | direct or parent-request policy         | RLS structure is suitable to evolve; exact payload version, evidence, idempotency, and verified outcome fields are incomplete          |
| Automation                 | `automation_configs`, `automation_runs`                                                                     | `user_id`; owner policies               | Tables exist and are typed; current service behavior remains incomplete                                                                |
| Consent / audit            | `consent_records`, `audit_events`, `admin_audit_logs`, `analytics_events`                                   | owner or explicit service-only policies | Structurally isolated; duplicate `audit_events` policies should be consolidated later                                                  |
| Feedback                   | `user_feedback`                                                                                             | nullable `user_id`; RLS on, no policy   | Fail-closed but functionally ambiguous; not a Prompt 004 blocker                                                                       |

## Critical RLS and credential findings

### P0: import/export child logs have no RLS

`export_job_logs` and `import_job_logs` contain messages and metadata linked to
user-owned parent jobs. RLS is disabled, while both `anon` and `authenticated`
roles have broad table privileges. Parent-table RLS does not automatically
protect child rows.

Required remediation: enable RLS, authorize through an `EXISTS` check against
the owning parent job, add two-user tests, and reduce grants to the exact
commands required. Do not rely on PostgREST route behavior as the control.

### P0: credential-bearing rows are browser-readable

The following owner policies allow authenticated users to select rows that
contain raw credential material:

- `profiles`: provider key column;
- `user_tokens`: access and refresh tokens for Google/Microsoft;
- `user_email_accounts`: access and refresh tokens;
- `user_integration_keys`: plaintext integration key.

This is not a demonstrated cross-user bypass: the policies consistently use
`auth.uid()`. It is still an unsafe boundary for XSS, browser tooling, overly
broad client queries, and accidental logging. The V1 design requires a
server-only credential store or safe projection that never returns secrets.
Existing credentials may need rotation after access/log review; the audit did
not inspect values or logs.

### P1: context migration is local-only

The repository migration adds the richer context shape and creates
`context_edges`, `context_permissions`, and `context_saved_views` with RLS.
Remote migration history does not include it. Live `context_entries` has only
the legacy nine-column shape; the other three tables do not exist.

Current context reads sometimes fall back to legacy columns, but writes target
the richer columns and the missing tables. This makes parts of context
functionally unreliable even though committed types imply they exist.

### P1: activity schema and application contract diverge

Live `activity_events` contains the small legacy shape (`source`, `severity`,
`title`, `body`, `metadata`, `read_at`, timestamps). Current activity services
also write/query fields such as event type, source identity/table, category,
priority, occurrence time, related entities, archive state, action URL, and a
search vector. Those operations will fail against the verified live schema.

Activity remains a projection under ADR-009; remediation must not promote it
to the canonical timeline merely to match the current callers.

## Generated-type drift

The live type output was reviewed but is not appropriate to commit yet.
Replacing the repository file now would remove context types required by code
while adding live legacy tables, concealing rather than resolving the split.

Live tables absent from committed types (26):

```text
artifacts, body_issue_history, body_issues, companies,
company_memberships, company_timeclock_entries, context_exports,
conversion_jobs, documents, email_actions, email_processing_log,
email_snapshots, export_job_logs, export_jobs, file_folders, file_metadata,
file_text_extractions, import_export_audit_events, import_job_logs,
notifications, user_email_accounts, workspace_activity,
workspace_approvals, workspace_comments, workspace_invites,
workspace_members
```

Committed-type tables absent live:

```text
context_edges, context_permissions, context_saved_views
```

Shared-table column drift exists in `chess_studies`, `context_entries`,
`file_uploads`, `import_jobs`, `profiles`, and `user_tokens`. The live
PostgREST schema version is 14.5 while the committed file reports 14.4.

## Missing canonical V1 concepts

No live table currently provides these accepted concepts:

- source connection cursor/health as a complete ingestion contract;
- minimized raw observations with replay identity;
- normalized personal timeline events;
- evidence-backed insights/briefings;
- evidence-linked candidate actions and immutable approval payload versions;
- complete execution verification and outcome/compensation state.

Existing `integration_connections`, `jobs`, `action_requests`,
`action_results`, and automation tables should be evolved where Prompt 004's
live-schema design review confirms they are adequate. Activity, context, and
knowledge must retain the ADR-009 boundaries.

## Safe baseline strategy proposed

Adopt a **recovered-history plus sanitized evidence** baseline, not a squashed
executable schema dump:

1. Recover the 46 remote migration files with `supabase migration fetch` into
   an isolated directory. Recovery was successfully proven during this audit.
2. Manually review every recovered file. Sanitize the two migrations containing
   email literals so fresh environments do not reproduce private/admin
   identity. Record that their repository checksums intentionally differ from
   the remote manifest.
3. Commit reviewed historical migrations under their original versions. Since
   remote history already marks them applied, normal migration tooling must
   not recreate their objects on `webwidgets-dev`.
4. Keep the sanitized inventory and checksum manifest as audit evidence. Do
   not commit the raw live dump as a runnable migration.
5. Reconcile `202605300001_context_substrate.sql` against the recovered history
   and verified live schema. Test it on an ephemeral database restored from the
   reviewed history before any remote push.
6. Apply later remediations only as new timestamped, additive migrations with
   same-migration RLS and explicit rollback/restore notes.
7. Regenerate and commit Supabase types only after the baseline, context, and
   critical RLS remediations agree with live.

Baseline-only rollback is a repository revert because steps 1–4 do not mutate
the database. Any later remote migration needs a pre-change schema dump,
Supabase backup/PITR confirmation, additive forward repair, and a separately
approved deployment window.

The project owner approved this strategy on 2026-08-14. ADR-012 is Active, and
steps 1–4 completed without remote mutation. The recovery evidence is in
[`2026-08-14-webwidgets-dev-baseline-recovery.md`](2026-08-14-webwidgets-dev-baseline-recovery.md).

## Remediation handoff

The separately scoped, dependency-ordered tasks are in
[`2026-08-13-webwidgets-dev-schema-remediation-plan.md`](2026-08-13-webwidgets-dev-schema-remediation-plan.md).
No migration in that plan was created, applied, or pushed by this audit.
