import { createAdminClient } from '@/lib/supabase/adminClient';
import type { TrackEventOptions } from './analyticsTypes';

// Module-level singleton — reused across warm lambda invocations
const admin = createAdminClient();

export async function trackEventServer(opts: TrackEventOptions): Promise<void> {
    try {
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

    // Fire-and-forget PostHog via REST API — never blocks the response
    const apiKey = process.env.POSTHOG_API_KEY;
    if (apiKey && opts.userId) {
        capturePosthog(apiKey, opts);
    }
}

function capturePosthog(apiKey: string, opts: TrackEventOptions): void {
    const host = process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com';
    fetch(`${host}/capture/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: apiKey,
            event: opts.type,
            distinct_id: opts.userId,
            properties: {
                ...(opts.metadata ?? {}),
                ...(opts.source ? { $source: opts.source } : {}),
            },
            timestamp: new Date().toISOString(),
        }),
    }).catch(() => {});
}
