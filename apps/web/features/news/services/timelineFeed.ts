import type {
    SourceHealthState,
    TimelineFeedItem,
    TimelineSourceHealth,
} from '@/features/news/types/timelineFeed';

export interface TimelineRow {
    id: string;
    event_type: string;
    source_type: string;
    title: string;
    summary: string | null;
    occurred_at: string;
    ingested_at: string;
    updated_at: string;
    state: string;
    revision: number;
    source_record_table: string | null;
    source_record_id: string | null;
    metadata: unknown;
}

export interface ConnectionHealthRow {
    id: string;
    provider_id: string;
    state: string;
    sync_status: string;
    consecutive_failures: number;
    last_checked_at: string | null;
    last_sync_succeeded_at: string | null;
    next_sync_at: string | null;
    disabled_at: string | null;
    disconnected_at: string | null;
    sync_error_code: string | null;
    fetch_interval_minutes: number;
    external_account_id: string | null;
    source_url: string | null;
    metadata: unknown;
    created_at: string;
}

type Metadata = Record<string, unknown>;

function metadataOf(value: unknown): Metadata {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Metadata)
        : {};
}

function textValue(value: unknown): string | null {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function safeTimelineText(value: string | null, limit: number) {
    if (!value) return null;
    const withoutMarkup = value
        .replace(/<[^>]*>/g, ' ')
        .replace(/[\u0000-\u001F\u007F]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return withoutMarkup ? withoutMarkup.slice(0, limit) : null;
}

export function safeSourceUrl(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:'
            ? url.toString()
            : null;
    } catch {
        return null;
    }
}

function sourceLabel(row: TimelineRow, metadata: Metadata): string {
    return (
        textValue(metadata['publisher']) ??
        textValue(metadata['provider']) ??
        row.source_type.replaceAll('_', ' ')
    );
}

export function mapTimelineRows(rows: TimelineRow[]): TimelineFeedItem[] {
    const base = rows.map((row) => {
        const metadata = metadataOf(row.metadata);
        return {
            id: row.id,
            eventType: row.event_type,
            sourceType: row.source_type,
            title: safeTimelineText(row.title, 500) ?? 'Timeline event',
            summary: safeTimelineText(row.summary, 1_000),
            occurredAt: row.occurred_at,
            ingestedAt: row.ingested_at,
            updatedAt: row.updated_at,
            state: row.state,
            revision: row.revision,
            sourceLabel: sourceLabel(row, metadata),
            sourceUrl: safeSourceUrl(
                metadata['contentReference'] ?? metadata['canonicalUrl'],
            ),
            sourceRecordTable: row.source_record_table,
            sourceRecordId: row.source_record_id,
            relatedStoryKey: textValue(metadata['relatedStoryKey']),
            relatedEvents: [],
        } satisfies TimelineFeedItem;
    });
    const clusters = new Map<string, TimelineFeedItem[]>();
    for (const item of base) {
        if (!item.relatedStoryKey) continue;
        clusters.set(item.relatedStoryKey, [
            ...(clusters.get(item.relatedStoryKey) ?? []),
            item,
        ]);
    }
    return base.map((item) => ({
        ...item,
        relatedEvents: item.relatedStoryKey
            ? (clusters.get(item.relatedStoryKey) ?? [])
                  .filter((related) => related.id !== item.id)
                  .map(({ id, title }) => ({ id, title }))
            : [],
    }));
}

function needsReconnect(row: ConnectionHealthRow): boolean {
    const code = row.sync_error_code?.toLowerCase() ?? '';
    return ['auth', 'token', 'unauthorized', 'forbidden', 'consent'].some(
        (value) => code.includes(value),
    );
}

export function deriveSourceHealth(
    row: ConnectionHealthRow,
    now = new Date(),
): SourceHealthState {
    if (
        row.disabled_at ||
        row.disconnected_at ||
        ['disabled', 'disconnected'].includes(row.state)
    )
        return 'disabled';
    if (row.state === 'reconnect_required') return 'reconnect_required';
    if (needsReconnect(row)) return 'reconnect_required';
    if (['syncing', 'running'].includes(row.sync_status)) return 'syncing';
    if (
        row.consecutive_failures > 0 ||
        ['failed', 'error'].includes(row.sync_status)
    )
        return 'failing';
    if (row.last_sync_succeeded_at) {
        const interval = Math.max(row.fetch_interval_minutes, 30) * 2 * 60_000;
        return now.getTime() - Date.parse(row.last_sync_succeeded_at) > interval
            ? 'stale'
            : 'healthy';
    }
    const grace = Math.max(row.fetch_interval_minutes, 30) * 2 * 60_000;
    return now.getTime() - Date.parse(row.created_at) > grace
        ? 'stale'
        : 'connected';
}

export function mapSourceHealth(
    rows: ConnectionHealthRow[],
    now = new Date(),
): TimelineSourceHealth[] {
    return rows.map((row) => {
        const metadata = metadataOf(row.metadata);
        return {
            id: row.id,
            providerId: row.provider_id,
            label:
                textValue(metadata['feedTitle']) ??
                row.external_account_id ??
                safeSourceUrl(row.source_url) ??
                row.provider_id.replaceAll('_', ' '),
            health: deriveSourceHealth(row, now),
            lastCheckedAt: row.last_checked_at,
            lastSucceededAt: row.last_sync_succeeded_at,
            nextSyncAt: row.next_sync_at,
            failureCount: row.consecutive_failures,
            issueCode: row.sync_error_code,
        };
    });
}
