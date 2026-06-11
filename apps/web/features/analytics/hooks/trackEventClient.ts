import { apiRouteFetch } from '@/lib/api/client';
import type { TrackEventOptions } from '@/features/analytics/types/analytics';

const FLUSH_DELAY_MS = 1200;
const DEDUPE_WINDOW_MS = 1500;
const MAX_BATCH_SIZE = 20;

let queue: TrackEventOptions[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let flushScheduled = false;
const recentEvents = new Map<string, number>();

function requestIdle(fn: () => void) {
    if (typeof window === 'undefined') return;
    const idle = window.requestIdleCallback;
    if (idle) {
        idle(fn, { timeout: FLUSH_DELAY_MS });
        return;
    }
    flushTimer = setTimeout(fn, FLUSH_DELAY_MS);
}

function dedupeKey(opts: TrackEventOptions) {
    return JSON.stringify({
        userId: opts.userId ?? null,
        type: opts.type,
        source: opts.source ?? null,
        action: opts.metadata?.action,
        path: opts.metadata?.path,
        label: opts.metadata?.label,
        href: opts.metadata?.href,
    });
}

function shouldDedupe(opts: TrackEventOptions) {
    const now = Date.now();
    const key = dedupeKey(opts);
    const last = recentEvents.get(key) ?? 0;
    recentEvents.set(key, now);

    for (const [eventKey, timestamp] of recentEvents) {
        if (now - timestamp > DEDUPE_WINDOW_MS * 4) {
            recentEvents.delete(eventKey);
        }
    }

    return now - last < DEDUPE_WINDOW_MS;
}

function sendBatch(events: TrackEventOptions[]) {
    if (events.length === 0) return;
    const payload = JSON.stringify({ events });

    if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        if (navigator.sendBeacon('/api/analytics/track', blob)) return;
    }

    void apiRouteFetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
    }).catch(() => {
        /* analytics is best-effort */
    });
}

export function flushAnalyticsEvents(): void {
    if (flushTimer) {
        clearTimeout(flushTimer);
        flushTimer = null;
    }
    flushScheduled = false;
    const batch = queue;
    queue = [];
    sendBatch(batch);
}

function scheduleFlush() {
    if (flushScheduled) return;
    flushScheduled = true;
    requestIdle(flushAnalyticsEvents);
}

/**
 * Client-side event tracking — batches /api/analytics/track.
 * Never throws; analytics failures must not degrade the UX.
 */
export function trackEvent(opts: TrackEventOptions): void {
    if (typeof window === 'undefined') return;
    if (shouldDedupe(opts)) return;

    queue.push(opts);
    if (queue.length >= MAX_BATCH_SIZE) {
        flushAnalyticsEvents();
        return;
    }
    scheduleFlush();
}
