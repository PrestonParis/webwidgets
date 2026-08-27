import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import type { CommitmentSourceEvent, ProposedCommitment } from './types';

export function hasCommitmentConsent(
    records: Array<{ scope: string; state: string }>,
) {
    const granted = new Set(
        records
            .filter((record) => record.state === 'granted')
            .map((record) => record.scope),
    );
    return granted.has('timeline_analysis') && granted.has('email_access');
}

function metadataOf(value: Json): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? value
        : {};
}

export async function loadCommitmentEvents(
    db: SupabaseClient<Database>,
    userId: string,
    from: string,
) {
    const consents = await db
        .from('consent_records')
        .select('scope,state')
        .eq('user_id', userId)
        .in('scope', ['timeline_analysis', 'email_access', 'calendar_access']);
    if (consents.error) throw new Error('candidate_consent_unavailable');
    if (!hasCommitmentConsent(consents.data ?? [])) return [];
    const result = await db
        .from('timeline_events')
        .select(
            'id,event_type,source_type,title,summary,occurred_at,content_hash,metadata',
        )
        .eq('user_id', userId)
        .is('deleted_at', null)
        .in('state', ['active', 'corrected'])
        .in('source_type', ['gmail', 'outlook'])
        .gte('occurred_at', from)
        .order('occurred_at', { ascending: false })
        .limit(100);
    if (result.error) throw new Error('candidate_events_unavailable');
    return (result.data ?? []).map(
        (row): CommitmentSourceEvent => ({
            id: row.id,
            eventType: row.event_type,
            sourceType: row.source_type,
            title: row.title,
            summary: row.summary,
            occurredAt: row.occurred_at,
            contentHash: row.content_hash,
            metadata: metadataOf(row.metadata),
        }),
    );
}

export async function loadExistingTaskKeys(
    db: SupabaseClient<Database>,
    userId: string,
) {
    const result = await db
        .from('todos')
        .select('text,due_at')
        .eq('user_id', userId)
        .eq('completed', false)
        .limit(200);
    if (result.error) return new Set<string>();
    return new Set(
        (result.data ?? []).map(
            (todo) =>
                `task:${todo.text
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, ' ')
                    .trim()}:${todo.due_at?.slice(0, 10) ?? ''}`,
        ),
    );
}

export async function loadCommitmentTimezone(
    db: SupabaseClient<Database>,
    userId: string,
) {
    const result = await db
        .from('briefing_preferences')
        .select('timezone')
        .eq('user_id', userId)
        .maybeSingle();
    return result.data?.timezone ?? 'UTC';
}

export async function loadExistingCalendarKeys(
    db: SupabaseClient<Database>,
    userId: string,
) {
    const result = await db
        .from('timeline_events')
        .select('title,metadata')
        .eq('user_id', userId)
        .like('event_type', 'calendar.%')
        .in('state', ['active', 'corrected'])
        .limit(200);
    if (result.error) return new Set<string>();
    return new Set(
        (result.data ?? []).map((event) => {
            const metadata = metadataOf(event.metadata);
            const startsAt =
                typeof metadata.start === 'string' ? metadata.start : '';
            const title = event.title
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, ' ')
                .trim();
            return `calendar:${title}:${startsAt.slice(0, 10)}`;
        }),
    );
}

export async function loadEmailActionHints(
    db: SupabaseClient<Database>,
    userId: string,
    events: CommitmentSourceEvent[],
    now: string,
): Promise<ProposedCommitment[]> {
    const eventByEmailId = new Map<string, CommitmentSourceEvent>();
    for (const event of events) {
        const objectId = event.metadata.providerObjectId;
        if (typeof objectId === 'string')
            eventByEmailId.set(`${event.sourceType}:${objectId}`, event);
    }
    if (!eventByEmailId.size) return [];
    const result = await db
        .from('email_actions')
        .select('email_id,title,description,due_date,action_url')
        .eq('user_id', userId)
        .in('email_id', [...eventByEmailId.keys()])
        .not('due_date', 'is', null)
        .limit(100);
    if (result.error) return [];
    return (result.data ?? []).flatMap((action) => {
        const event = eventByEmailId.get(action.email_id);
        if (
            !event ||
            !action.due_date ||
            Date.parse(action.due_date) <= Date.parse(now)
        )
            return [];
        return [
            {
                kind: 'task' as const,
                payload: {
                    title: action.title.slice(0, 300),
                    notes: (action.description ?? '').slice(0, 1_000),
                    dueAt: new Date(action.due_date).toISOString(),
                    sourceReference: action.action_url,
                },
                reason: 'The existing hybrid email classifier/extractor found a dated action for review.',
                evidenceIds: [event.id],
                confidence: 0.7,
                extractorVersion: 'email-hybrid-hint-v1',
                modelVersion: null,
            },
        ];
    });
}
