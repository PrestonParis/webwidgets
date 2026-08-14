# webwidgets-dev Migration Baseline Recovery

Status: Complete — repository only

Date: 2026-08-14

Project: `webwidgets-dev` (`cvroudtyxsgllivlrayu`)

## Outcome

All 46 migrations recorded in the remote Supabase history were recovered into
`supabase/migrations/` under their original version and filename. A read-only
`supabase migration list` verification now shows those 46 versions aligned
locally and remotely. `202605300001_context_substrate.sql` is the sole
local-only successor.

No project was linked, no migration was pushed or applied, and no remote schema
or row data changed.

## Privacy sanitization

The remote checksum manifest identified email literals in two historical
migrations. The repository versions intentionally differ:

| Migration | Repository SHA-256 | Sanitization |
| --- | --- | --- |
| `20260516000003_admin_role.sql` | `847b1043c4830f3b8e622732f0b59e8b7c026a9c6b61fbdfb1e9fa54aa0f1258` | Removed embedded account identity from documentation/error output; retained the service-role-only helper |
| `20260516000004_seed_admin.sql` | `7fc97c795fbdcded93215e54a2e6ea94e63259690bb5936b4c503c67ac051706` | Replaced account-specific seeding with a non-executable operational note |

Fresh environments must grant administrator roles through an explicit secure
operation. They must not reproduce a production account identity from schema
history.

## Review performed

- All non-sanitized files match the remote manifest checksums.
- No recovered repository migration contains an email-address literal or
  recognized live/test/provider secret-key pattern.
- No recovered migration drops a table/schema/column/type, truncates a table,
  deletes rows, or disables RLS.
- Historical broad grants, owner-readable credential tables, missing RLS on
  import/export child logs, and later SECURITY DEFINER helpers with mutable or
  unset search paths were preserved as evidence rather than rewritten inside
  history. They remain explicit remediation work.
- The recovered files total 46; with the context successor, the repository now
  tracks 47 migrations.

## Next safety boundary

Do not run `supabase db push` against `webwidgets-dev` as a baseline operation.
The local-only context migration and every new remediation migration must first
be tested against an ephemeral database created from the reviewed history.
Remote application requires its own human-approved deployment window,
pre-change schema dump, and backup/PITR confirmation.
