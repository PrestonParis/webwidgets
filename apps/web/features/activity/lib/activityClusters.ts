// Activity clustering — groups raw events into meaningful summaries.
// Operates on an already-loaded event list; does NOT fetch from DB.
// Raw events are always preserved; clusters are a derived display layer.

import type {
    ActivityEvent,
    ActivityEventSource,
} from '@/features/activity/types/activity';

export interface ActivityCluster {
    id: string;
    source: ActivityEventSource;
    eventType: string;
    label: string;
    count: number;
    events: ActivityEvent[];
    latestOccurredAt: string;
    severity: string;
    filterUrl: string;
}

// Time buckets for grouping (in ms)
const BUCKET_MS = 3 * 60 * 60 * 1000; // 3-hour windows

function bucketKey(iso: string): string {
    const ts = new Date(iso).getTime();
    const bucket = Math.floor(ts / BUCKET_MS);
    return String(bucket);
}

function clusterKey(event: ActivityEvent): string {
    return `${event.source}::${event.eventType ?? 'unknown'}::${bucketKey(event.occurredAt)}`;
}

function buildLabel(source: string, eventType: string, count: number): string {
    const noun = eventTypeToNoun(eventType);
    const countStr = count === 1 ? '' : `${count} `;
    return `${countStr}${noun}`;
}

function eventTypeToNoun(eventType: string): string {
    const map: Record<string, string> = {
        'todo.completed': 'task completed',
        'todo.created': 'task created',
        'todo.deleted': 'task deleted',
        'artifact.generated': 'artifact generated',
        'artifact.updated': 'artifact updated',
        'artifact.archived': 'artifact archived',
        'file.uploaded': 'file uploaded',
        'file.extracted': 'text extracted',
        'file.extraction_failed': 'extraction failed',
        'news.imported': 'news feed imported',
        'calendar.event_created': 'calendar event created',
        'calendar.event_updated': 'calendar event updated',
        'automation.executed': 'automation executed',
        'automation.failed': 'automation failed',
        'document.created': 'document created',
        'document.updated': 'document updated',
        'finance.transaction_added': 'transaction added',
        'finance.account_created': 'account added',
        'memory.card_created': 'flashcard created',
        'memory.card_reviewed': 'card reviewed',
        'tracking.entry_created': 'tracking entry',
        'email.action_extracted': 'email actions extracted',
        'research.completed': 'research completed',
        'collaboration.comment_added': 'comment added',
        'collaboration.handoff_created': 'handoff created',
    };
    const label = map[eventType];
    if (label) return label;
    // Fallback: humanize the event type string
    return eventType.split('.').pop()?.replace(/_/g, ' ') ?? eventType;
}

// Only cluster event types that produce meaningful noise when there are many
const CLUSTER_TYPES = new Set([
    'todo.completed',
    'todo.created',
    'artifact.generated',
    'file.uploaded',
    'file.extracted',
    'news.imported',
    'memory.card_created',
    'memory.card_reviewed',
    'tracking.entry_created',
    'email.action_extracted',
    'document.updated',
    'finance.transaction_added',
]);

const MIN_CLUSTER_SIZE = 3; // only cluster if 3+ events of same type in same window

export function buildActivityClusters(events: ActivityEvent[]): {
    clusters: ActivityCluster[];
    unclustered: ActivityEvent[];
} {
    const groups = new Map<string, ActivityEvent[]>();

    for (const event of events) {
        if (!event.eventType || !CLUSTER_TYPES.has(event.eventType)) continue;
        const key = clusterKey(event);
        const existing = groups.get(key) ?? [];
        existing.push(event);
        groups.set(key, existing);
    }

    const clusteredIds = new Set<string>();
    const clusters: ActivityCluster[] = [];

    for (const [key, groupEvents] of groups.entries()) {
        if (groupEvents.length < MIN_CLUSTER_SIZE) continue;

        const first = groupEvents[0]!;
        const eventType = first.eventType ?? 'unknown';
        clusteredIds.add(key); // mark key as clustered, not individual IDs

        // Sort cluster events by recency
        const sorted = [...groupEvents].sort(
            (a, b) =>
                new Date(b.occurredAt).getTime() -
                new Date(a.occurredAt).getTime(),
        );

        const label = buildLabel(first.source, eventType, groupEvents.length);
        const filterUrl = `/activity?source=${first.source}&event_type=${encodeURIComponent(eventType)}`;

        clusters.push({
            id: key,
            source: first.source,
            eventType,
            label:
                groupEvents.length > 1
                    ? `${groupEvents.length} ${label}`
                    : label,
            count: groupEvents.length,
            events: sorted,
            latestOccurredAt: sorted[0]?.occurredAt ?? first.occurredAt,
            severity: groupEvents.some((e) => e.severity === 'critical')
                ? 'critical'
                : groupEvents.some((e) => e.severity === 'warning')
                  ? 'warning'
                  : 'info',
            filterUrl,
        });

        // Mark individual events as clustered
        for (const e of groupEvents) {
            clusteredIds.add(e.id);
        }
    }

    const unclustered = events.filter((e) => {
        if (!e.eventType || !CLUSTER_TYPES.has(e.eventType)) return true;
        // Include event if its cluster group was below threshold
        const key = clusterKey(e);
        return !clusters.some((c) => c.id === key);
    });

    return {
        clusters: clusters.sort(
            (a, b) =>
                new Date(b.latestOccurredAt).getTime() -
                new Date(a.latestOccurredAt).getTime(),
        ),
        unclustered,
    };
}
