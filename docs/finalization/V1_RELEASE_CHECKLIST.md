# WebWidgets V1 Deployment and Rollback Checklist

## Pre-deployment

- [ ] Seven consecutive pilot days meet every frozen launch threshold.
- [x] The three `test:v1` journeys passed against production-like services on
      2026-08-30 (3 passed in 22.5 seconds).
- [ ] Targeted lint, type, unit, integration, Supabase, sync-worker, and CI
      checks pass for the release commit.
- [ ] PR #22 has a non-author review and all reported CI checks are green.
- [ ] GitHub required checks are actually enforced in repository settings.
- [ ] No critical/high security finding or automatic `No Go` condition is
      open.
- [ ] Production worker uses continuous compute and persistent queue storage.
- [ ] External monitoring scrapes protected metrics and delivers alerts to an
      owned receiver.
- [ ] Supabase migration list matches the repository and a recovery point is
      recorded before applying new migrations.
- [ ] Vercel, Render, Supabase, Google, Microsoft, Anthropic, and alerting
      owners/credentials are confirmed without copying secrets into evidence.
- [ ] Release owner signs the final acceptance matrix.

## Deployment

1. Freeze the approved release commit and record its full SHA.
2. Apply only reviewed, tracked Supabase migrations in order; recheck the
   linked migration list.
3. Deploy the continuous worker with provider schedules disabled and verify
   `/ready`, heartbeat, queue connectivity, Supabase connectivity, and exact
   release identity.
4. Deploy the web release and verify auth, command center, timeline, inbox,
   automation center, and protected operations metrics.
5. Enable RSS, Gmail/Calendar, and Outlook schedules one source class at a
   time. Verify healthy sync and canonical event counts after each cutover.
6. Enable briefing and bounded automation schedules. Keep global pause within
   immediate operator reach.
7. Run the three V1 E2E journeys and capture safe evidence.
8. Observe the launch window for alerts, lag, duplicates, failed/unknown
   actions, cost, and security findings.

## Rollback triggers

Rollback or globally pause immediately for silent data loss, duplicate side
effects, cross-user access, leaked secrets/private content, fake success,
uncited claims presented as fact, uncontrolled cost, or a pause/approval bypass.

## Rollback

1. Set global per-user pause and disable provider schedule ownership. Do not
   delete jobs or receipts.
2. Route web traffic to the last verified Vercel deployment and worker traffic
   to the last verified continuous-worker image.
3. Leave ambiguous provider actions stopped; reconcile them from provider
   identifiers and canonical receipts before retrying.
4. Reverse a schema change only with its reviewed compensating migration.
   Restore from the pre-deploy recovery point when forward repair cannot
   preserve data.
5. Confirm old-version compatibility with the current schema, queue, and
   credential boundary before resuming ingestion.
6. Record the incident using safe identifiers, recovery time, affected counts,
   and the next decision owner. Restart the seven-day pilot when correctness
   evidence was invalidated.

## Current recommendation

**No Go.** Code-level release preparation is active, but the seven-day pilot,
enforced required checks, production worker/queue cutover, external alert
delivery, and human sign-off remain accountable blockers.
