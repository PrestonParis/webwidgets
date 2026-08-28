# Email credential and OAuth cutover

2026-08-28 — prerequisite and production cutover approved by the owner.
Security code is live on `finalization`; both migrations are applied.
Prompt 014 remains incomplete pending live provider verification and executors.

## Scope and evidence

Live metadata checks confirmed that `authenticated` could select raw token
columns in both `user_tokens` and `user_email_accounts`. No real credential
values were selected. Linked migration history matches through `202608270005`.

The prepared migrations close table-wide and column-level browser grants,
leave owner-only SELECT access to an explicit metadata allowlist, and confine
credential writes to service-role APIs. OAuth connection attempts are one-use,
short-lived, user/provider-bound records. Microsoft adds PKCE; Google retains
Supabase PKCE and adds a separate owner-bound connection nonce. Provider
identity and actual granted scopes are verified before atomic persistence.
Google callback session cookies are rebuilt without provider credentials.

Existing rows stay in place. This is an access-control cutover, **not** a Vault
migration, credential rotation, or complete removal of legacy token mirrors.
The worker owns account-specific credentials; authenticated legacy API readers
use a cookie-free service client only after user verification. Snapshot
resolvers delegate credential reads to API-boundary helpers. Unrelated shared
Supabase client behavior is unchanged. `profiles`/`user_integration_keys`
credential findings remain open. Previously issued browser copies cannot be
retroactively erased by a database grant change.

No Gmail compose/send or Microsoft Mail.Send scopes are requested yet. Existing
account grants are not backfilled with guessed scopes: reconnect must establish
verified capabilities. Future execution must trust protected account grants,
not browser-editable or legacy canonical connection scope metadata alone.

## Deployment order — maintenance window required

### Signed-in deployment audit (2026-08-28)

Dashboard access is now available. Read-only inspection found these additional
release blockers; no environment values were changed or deployments started:

- Vercel production `webwidgets.me` runs `main` at `23ac39f`, not
  `finalization`. The branch preview at `62b3d1f` is marked Ready, which is
  build/deployment evidence only, not proof its integrations work.
- Production's public Supabase URL is the approved
  `cvroudtyxsgllivlrayu.supabase.co`. The pre-production URL is still
  `ilmqvnxdyherzjwzucpp.supabase.co`. Do not assume preview credentials match
  production or use that preview to validate the linked database.
- Render worker deployment `62b3d1f` failed at startup because `WEB_APP_URL`
  and `WORKER_API_TOKEN` are missing. Both are absent from the expanded
  environment inventory, with no linked environment groups. The last listed
  successful worker deployment is `87f0a07` (August 24).
- The inference deployment also failed its `/v1/ready` health check. It is a
  separate outstanding deployment issue, not fixed by credential migrations.

Before the cutover, obtain the owner's decision on promoting `finalization`
to `webwidgets.me` versus keeping a preview-only test target. Configure the
matching web/worker URL and authentication token securely, verify environment
parity and OAuth redirect destinations, then verify deployment health. Do not
merge PR #22 or change the production branch as an incidental configuration fix.
The original coordinated maintenance sequence below remains required.

The owner subsequently approved `finalization` as the production branch and
the coordinated rollout. Branch tracking is saved in Vercel. Render's missing
worker URL/token are configured; its `62b3d1f` redeployment is healthy. Provider
sync was previously enabled and is temporarily paused; legacy email sync was
already disabled. Production worker authentication is being configured before
publishing the security revision. No send scopes or outbound messages are
enabled by this release.

These migrations deliberately fail closed and are coupled to the new callback
code. Do not apply only the grant revocation to the running old app, or publish
the new callbacks against the old database.

1. Review the diff and CI build; identify the app and worker deployment versions.
   Confirm web `GOOGLE_CLIENT_ID` matches the client configured in Supabase,
   Microsoft client/secret/tenant and callback URI, and existing service-role
   configuration. Verify presence without printing values. Keep write/send
   capability disabled throughout this cutover.
2. During the agreed window, pause new provider connections and provider sync
   delivery. Record affected connection IDs and previous enabled states using
   metadata only. Avoid draining/resetting queues or rotating credentials.
3. Run `npx supabase migration list --linked`, then reviewed `db push --linked`
   for `202608280001` and `202608280002`; deploy the matching web and worker
   revisions immediately. Do not include unrelated pending migrations.
4. Regenerate tracked Supabase types. Run the SQL security suites, then the
   callback E2E spec against the deployed app. Confirm anonymous/owner secret
   reads and writes fail while owner metadata still works.
5. With the owner present, reconnect Gmail first and Outlook second. Check safe
   local redirect, original app-user session preservation when connecting a
   different mailbox, actual granted scopes, no provider tokens in new browser
   session storage, and both accounts surviving reconnect. Deny consent once
   and confirm it does not replace working credentials.
6. Verify one existing read-only sync and source-health update, expired-token
   refresh, and controlled disconnect/reconnect for the test account. Resume
   only previously enabled connections/schedules. Render free-tier sleep remains
   a limitation; this cutover does not establish 24/7 execution.

Only then pass the prerequisite gate and implement explicit scope upgrades and
Gmail-first draft/send actions. A live email send needs a separately approved
recipient and exact message; no test email was sent here.

## Rollback/recovery

Before database commit, abort the transaction. The rehearsal below does exactly
that and leaves no fixture accounts or schema changes behind.

After cutover, prefer a forward fix or a compatible app revision. Keep provider
connection/sync paused if callbacks or refresh fail. Do **not** restore browser
token grants, publish the old credential-bearing callback, delete accounts, or
reset the database as a rollback shortcut. The migration retains credentials
and canonical history, so repair does not require a bulk data restore. Any
rotation or Vault/data relocation needs a separately scoped maintenance plan.

## Verification performed

- `supabase/tests/010_email_credentials.test.sql`: 34 assertions passed on the
  linked project inside a rollback-only transaction containing the new schema;
  the harness raised on any failing pgTAP assertion. Covers two-user isolation,
  grants, metadata, identity mismatch, provider/account separation, reconnect,
  refresh without reactivation, nonce replay/expiry, and disconnect cleanup.
- Six targeted Vitest suites: 31 tests passed (OAuth policies, mocked-provider
  verification, direct callback handlers, credential-client ownership, and a
  real Supabase SSR exchange with mocked HTTP proving short/chunked provider
  tokens never reach final session cookies).
- The existing provider-connection SQL suite passed all 7 assertions in the
  same rollback-only rehearsal pattern. Its fixtures now supply actual scopes
  instead of relying on inferred grants, and its account-count assertion is
  limited to fixture users rather than counting existing live accounts.
- Worker typecheck and all 35 worker tests passed, including original ingestion
  regressions and new refresh/rotation/revocation tests.
- Web and root TypeScript checks passed. ESLint is run in separate project
  batches and passed for changed code: combining all projects exhausted the
  local 4 GB heap. The repository
  `npm run check` ignores scope arguments, so that accidental broad run was
  stopped; no clean full-repository check is claimed.
- New `tests/e2e/integration-oauth.spec.ts` awaits a matching deployed app. Real
  provider consent/reconnect, live read-only ingestion, and a CI build remain
  release gates. No local production build or persistent dev server was run.

## Approved release execution

- Published `b31a9970` (credential boundary/OAuth code) and `c7daa7a6`
  (live-generated Supabase types); no merge into `main`.
- Applied only `202608280001` and `202608280002`; linked history confirms both.
  The CLI's Docker migration-catalog cache warning did not prevent migration
  application. No database reset, token rotation, or outbound email occurred.
- Re-ran 34 credential assertions and 7 provider-connection assertions against
  the migrated schema, all passing with rollback-only fixtures. Final metadata
  checks confirm no fixture users remain and browser secret reads are denied.
- Render worker `c7daa7a6` is live and `/ready` reports all dependencies ready.
  Recorded `PROVIDER_SYNC_ENABLED=true` and `EMAIL_SYNC_ENABLED=false` before
  temporarily pausing provider scheduling. The two previously active
  connections were paused at `2026-08-28 18:15:15.436294+00`; restoration must
  match this timestamp so subsequent owner changes are never overwritten.
- Vercel production now tracks `finalization`, with production Supabase URL
  `cvroudtyxsgllivlrayu.supabase.co`, matching worker authentication, worker
  service URL, site URL, and the existing Microsoft server credentials.
  Real Google audience/consent and Microsoft redirect verification still need
  the owner reconnect journey; presence alone is not proof of OAuth validity.
- Vercel project pause also prevents builds. Replaced it with the published
  temporary `temporary-credential-cutover` deny rule (request path starts `/`),
  then resumed the project to permit builds. Confirmed the public old callback
  returns 403. Remove the temporary rule after the matching revision is live;
  do not resume the old credential-bearing callback as a recovery shortcut.

Production deployment `HqELhYArAcB9pUc4QuqNkRFxyWmH` is Ready at `webwidgets.me`
and uses `c7daa7a6`. The temporary firewall rule was deleted and the removal
published; the project is resumed. The previous production deployment's direct
URL redirects to Vercel SSO rather than publicly serving the old callback.

Six unauthenticated HTTP checks passed on production: three callback rejection
paths, authenticated-initiation enforcement, missing worker authorization
rejection, and public web liveness. These exercise the callback E2E spec's HTTP
assertions, not an authenticated browser consent journey. Web/root TypeScript,
41 targeted unit/route tests, and 35 worker tests also passed locally.

Provider scheduling is restored to its original enabled state. The two
existing mail connections intentionally remain paused, with credentials and
cursors preserved, until owner reconnect establishes actual granted scopes.
Both old access tokens were expired; live refresh/revocation and real read-only
sync must still be verified, not inferred from readiness. Reconnect clears the
selected account's pause through the verified persistence path. Do not blindly
clear all connection pauses or invent grants from legacy metadata.

Provider reconnection remains a release-verification gate. Historical preview
deployments still have the old Supabase environment and must not be used as
evidence for this release. The inference service's existing readiness failure
is separate outstanding work. Prompt 014 provider executors are not complete.

The `c7daa7a6` CI run completed successfully, including changed-file lint/types,
the unit-test gate, worker build, and production build. A live browser check
also found a pre-existing `/login` redirect to a nonexistent route. Both
provider start routes now redirect signed-out users to the actual `/` sign-in
screen. Two new route regressions and an authenticated-entry browser assertion
cover this correction; the route tests, scoped ESLint, and web TypeScript pass.

Provider reference: Microsoft documents optional refresh scopes and replacement
refresh tokens in its [authorization-code flow](https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow).
