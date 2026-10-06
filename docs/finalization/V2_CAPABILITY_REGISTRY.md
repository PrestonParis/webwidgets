# V2 production capability registry

The V2 planner may discover only versioned capabilities backed by an existing
production executor, verifier, and committed test fixture. Registry construction
fails when a name/version is duplicated, required metadata is invalid, a binding
is missing, a compensatable action lacks compensation, or a fixture does not
match its input and output schemas.

## Registered surface

| Capability                | Production executor                | Verification           | Compensation                          |
| ------------------------- | ---------------------------------- | ---------------------- | ------------------------------------- |
| `tasks.create@1`          | `execute_approved_task_action` RPC | task receipt read-back | `undo_task_action` RPC                |
| `tasks.update@1`          | `execute_approved_task_action` RPC | task receipt read-back | `undo_task_action` RPC                |
| `tasks.complete@1`        | `execute_approved_task_action` RPC | task receipt read-back | manual only                           |
| `calendar.create_event@1` | approved calendar adapter          | provider read-back     | calendar event deletion and read-back |
| `email.draft@1`           | approved email adapter             | provider read-back     | unavailable                           |

This intentionally excludes `email.send`, `automation.run`,
`news.parse_rss_feed`, and `system.generate_briefing`. The inventory classifies
the first three as beta and the last as a placeholder. V1 templates and provider
connection cards are also excluded because they are coordination/configuration
surfaces, not planner-invocable execution capabilities.

## Discovery boundary

Discovery requires both an eligible `name@version` from policy evaluation and a
usable connection with normalized scopes. Local task actions need no provider
connection. Calendar requires `calendar:write`; either Google or Microsoft mail
with `email:write` can expose email drafting. Discovery returns only the stable
identifier, risk/reversibility metadata, connection requirements, and a bounded
resource estimate. It does not expose executor identifiers, verifier identifiers,
schemas, fixtures, test paths, or internal ownership.

## Version lifecycle

`automation_capability_versions` records each immutable contract version and is
service-role-only. Objective plan steps reference its `(name, version)` key.
Definitions cannot be updated or deleted. Retirement is the sole removal path,
and the database rejects retirement while a published plan for a non-terminal
objective still references that version. A changed contract therefore requires a
new version and hash rather than an in-place edit.

The definition hashes are SHA-256 values over the committed identity, ownership,
risk, production binding identifiers, compensation identifier, and schema
revision label for each version. They are repeated in the TypeScript registry and
database seed so drift is reviewable.

## Deployment independence

The registry is tracked application code plus a Supabase migration. It does not
reference `.codex-worktrees`, a local home directory, or laptop-installed
software. Online deployments install dependencies from the repository manifests
and lockfiles and run the committed server and database artifacts.
