import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import { getUserOrThrow } from '@/lib/supabase/getUser';
import { resolveClassifications } from '@/features/inbox/lib/dbClassifications';
import { triggerUserSync } from '@/lib/syncQueue';
import { getLogger } from '@/lib/observability/logger';

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

export async function GET(_req: Request) {
    const log = getLogger({ operation: 'GET /api/outlook/inbox' });
    const { supabase, supabaseAdmin } = await createClients();

    let userId: string;
    try {
        const user = await getUserOrThrow(supabase);
        userId = user.id;
    } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin
        .from('email_snapshots')
        .select(
            'id,account_email,subject,sender_email,sender_name,snippet,received_at,raw_date',
        )
        .eq('user_id', userId)
        .eq('provider', 'outlook')
        .order('received_at', { ascending: false })
        .limit(50);

    if (error) {
        log.error({ err: error }, 'email_snapshots outlook query failed');
        return NextResponse.json(
            { error: 'Failed to load emails' },
            { status: 500 },
        );
    }

    const snapshots = (data ?? []) as Snapshot[];

    if (snapshots.length === 0) {
        const triggered = await triggerUserSync(userId);
        log.info({ triggered }, 'No outlook snapshots, triggering sync');
        return NextResponse.json({
            emails: [],
            nextPageToken: null,
            syncing: true,
        });
    }

    const parsed = snapshots.map((s) => ({
        id: s.id,
        sender: buildSender(s),
        subject: s.subject,
    }));

    const categoryMap = await resolveClassifications(supabase, userId, parsed);

    const emails = snapshots.map((s) => {
        const cat = categoryMap.get(s.id);
        return {
            id: s.id,
            provider: 'outlook' as const,
            subject: s.subject,
            sender: buildSender(s),
            snippet: s.snippet,
            date: s.raw_date || s.received_at,
            category: cat?.category ?? 'other',
            is_manual: cat?.is_manual ?? false,
        };
    });

    log.info({ count: emails.length }, 'Outlook inbox served from snapshots');
    return NextResponse.json({ emails, nextPageToken: null, syncing: false });
}
