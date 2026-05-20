import type { EventName } from './eventNames';

export interface TrackEventOptions {
    userId?: string;
    type: EventName;
    source?: string;
    metadata?: Record<string, unknown>;
}

/**
 * Server-side event tracking. Writes to analytics_events via service-role client.
 * Safe to call from API routes and server components.
 */
export async function trackEventServer(opts: TrackEventOptions): Promise<void> {
    try {
        const { createAdminClient } =
            await import('@/lib/supabase/adminClient');
        const admin = createAdminClient();
        await admin.from('analytics_events').insert({
            user_id: opts.userId ?? null,
            type: opts.type,
            source: opts.source ?? null,
            metadata: opts.metadata ?? null,
            created_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error('[analytics] trackEventServer failed:', err);
    }

    // Also send to PostHog via Node SDK if configured
    const apiKey = process.env.POSTHOG_API_KEY;
    if (apiKey && opts.userId) {
        try {
            const { PostHog } = await import('posthog-node');
            const client = new PostHog(apiKey, {
                host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
                flushAt: 1,
                flushInterval: 0,
            });
            client.capture({
                distinctId: opts.userId,
                event: opts.type,
                properties: opts.metadata ?? {},
            });
            await client.shutdown();
        } catch {
            // PostHog is optional — swallow
        }
    }
}

/**
 * Client-side event tracking — calls /api/analytics/track (fire-and-forget).
 * Never throws; analytics failures must not degrade the UX.
 */
export function trackEvent(opts: TrackEventOptions): void {
    void fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
    }).catch(() => {
        /* swallow */
    });
}
