import { NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { resolveClassifications } from '@/features/inbox/lib/dbClassifications';
import { triggerUserSync } from '@/lib/syncQueue';
import { getLogger, runWithContext } from '@/lib/observability/logger';

interface Snapshot {
    id: string;
    account_email: string;
    subject: string;
    sender_email: string;
    sender_name: string;
    snippet: string;
    received_at: string;
    raw_date: string;
}

function buildSender(row: Snapshot): string {
    return row.sender_name
        ? `${row.sender_name} <${row.sender_email}>`
        : row.sender_email;
}

async function handleRequest(
    req: Request,
    userId: string,
    supabase: SupabaseClient,
    supabaseAdmin: SupabaseClient,
) {
    const log = getLogger();
    const { searchParams } = new URL(req.url);
    // searchParams.get already decodes %2B → +, but if the client sent a raw +
    // it arrives as a space. Normalise spaces back so Postgres gets a valid timestamptz.
    const rawToken = searchParams.get('pageToken');
    const pageToken = rawToken ? rawToken.replace(/ /g, '+') : null;
    const PAGE_SIZE = 50;

    // Read from the snapshot table — the sync worker keeps this fresh.
    const query = supabaseAdmin
        .from('email_snapshots')
        .select(
            'id,account_email,subject,sender_email,sender_name,snippet,received_at,raw_date',
        )
        .eq('user_id', userId)
        .eq('provider', 'gmail')
        .order('received_at', { ascending: false })
        .limit(PAGE_SIZE);

    if (pageToken) {
        // pageToken is the last received_at timestamp — used as a cursor.
        query.lt('received_at', pageToken);
    }

    const { data, error } = await query;
    if (error) {
        log.error({ err: error }, 'email_snapshots query failed');
        return NextResponse.json(
            { error: 'Failed to load emails' },
            { status: 500 },
        );
    }

    const snapshots = (data ?? []) as Snapshot[];

    // No snapshots at all → trigger a sync and tell the client to wait.
    if (snapshots.length === 0 && !pageToken) {
        const triggered = await triggerUserSync(userId);
        log.info({ triggered }, 'No gmail snapshots found, triggering sync');
        return NextResponse.json({
            emails: [],
            nextPageToken: null,
            syncing: true,
        });
    }

    // Map to the Email shape the client expects.
    const parsed = snapshots.map((s) => ({
        id: s.id,
        sender: buildSender(s),
        subject: s.subject,
    }));

    // Apply classifications (DB-first, lightweight — no live API calls).
    const categoryMap = await resolveClassifications(supabase, userId, parsed);

    const emails = snapshots.map((s) => {
        const cat = categoryMap.get(s.id);
        return {
            id: s.id,
            provider: 'gmail' as const,
            subject: s.subject,
            sender: buildSender(s),
            snippet: s.snippet,
            date: s.raw_date || s.received_at,
            category: cat?.category ?? 'other',
            is_manual: cat?.is_manual ?? false,
            account_email: s.account_email,
        };
    });

    const nextPageToken =
        snapshots.length === PAGE_SIZE
            ? (snapshots[snapshots.length - 1]?.received_at ?? null)
            : null;

    log.info({ count: emails.length }, 'Gmail inbox served from snapshots');
    return NextResponse.json({ emails, nextPageToken, syncing: false });
}

export async function GET(req: Request) {
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const { supabase, supabaseAdmin } = await createClients();
    const user = await getUserOrThrow(supabase);

    return runWithContext(
        { requestId, userId: user.id, operation: 'GET /api/gmail/inbox' },
        () => handleRequest(req, user.id, supabase, supabaseAdmin),
    );
}
