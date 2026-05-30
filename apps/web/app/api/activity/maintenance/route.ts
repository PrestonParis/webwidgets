import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getRequestUserId } from '@/features/backend/lib/requestUser';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import { createAdminClient } from '@/lib/supabase/adminClient';

// POST /api/activity/maintenance
// Auto-archives old read events and prunes very old archived events.
// Safe to run repeatedly. Can be called by user action or a cron trigger.
//
// User-authenticated: operates on the calling user's events only.
// Cron mode (Authorization: Bearer CRON_SECRET): operates across all users.
//
// Body: {
//   archiveDays?: number;     // Archive read events older than N days (default: 30)
//   pruneDays?: number;       // Hard-delete archived events older than N days (default: 90)
// }

export async function POST(req: Request): Promise<Response> {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get('authorization');
    const isCron = cronSecret && authHeader === `Bearer ${cronSecret}`;

    const body = (await req.json().catch(() => ({}))) as {
        archiveDays?: number;
        pruneDays?: number;
    };

    const archiveDays = Math.max(7, body.archiveDays ?? 30);
    const pruneDays = Math.max(archiveDays + 1, body.pruneDays ?? 90);

    const archiveCutoff = new Date(
        Date.now() - archiveDays * 86_400_000,
    ).toISOString();
    const pruneCutoff = new Date(
        Date.now() - pruneDays * 86_400_000,
    ).toISOString();

    if (isCron) {
        // Cron: use service-role client to sweep across all users
        const adminSupabase = createAdminClient();
        const [archiveResult, pruneResult] = await Promise.allSettled([
            adminSupabase
                .from('activity_events')
                .update({ is_archived: true })
                .eq('is_archived', false)
                .lt('occurred_at', archiveCutoff)
                .not('read_at', 'is', null),
            adminSupabase
                .from('activity_events')
                .delete()
                .eq('is_archived', true)
                .lt('occurred_at', pruneCutoff),
        ]);

        return NextResponse.json({
            ok: true,
            mode: 'cron',
            archiveDays,
            pruneDays,
            archiveError:
                archiveResult.status === 'rejected'
                    ? String(archiveResult.reason)
                    : null,
            pruneError:
                pruneResult.status === 'rejected'
                    ? String(pruneResult.reason)
                    : null,
        });
    }

    // User-authenticated mode: scope to the requesting user only
    try {
        const { supabase } = await createClients();
        const userId = await getRequestUserId(supabase);

        // Step 1: archive read events older than archiveDays
        const { error: archiveError } = await supabase
            .from('activity_events')
            .update({ is_archived: true })
            .eq('user_id', userId)
            .eq('is_archived', false)
            .lt('occurred_at', archiveCutoff)
            .not('read_at', 'is', null);

        // Step 2: hard-delete archived events older than pruneDays
        const { error: pruneError } = await supabase
            .from('activity_events')
            .delete()
            .eq('user_id', userId)
            .eq('is_archived', true)
            .lt('occurred_at', pruneCutoff);

        if (archiveError) throw archiveError;
        if (pruneError) throw pruneError;

        return NextResponse.json({
            ok: true,
            mode: 'user',
            archiveDays,
            pruneDays,
        });
    } catch (err) {
        if (err instanceof Error && err.message === 'Unauthorized')
            return NextResponse.json(
                { error: 'UNAUTHORIZED' },
                { status: 401 },
            );
        if (isMissingTableError(err))
            return NextResponse.json({ ok: true, mode: 'noop' });
        return NextResponse.json({ error: 'INTERNAL_ERROR' }, { status: 500 });
    }
}
