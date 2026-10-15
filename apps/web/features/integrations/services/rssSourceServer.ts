import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { rssSourceInputSchema } from '@/features/integrations/types/rssSources';

const blockedHosts = new Set([
    'localhost',
    'metadata.google.internal',
    'metadata.google.com',
]);

function unsafeIp(host: string) {
    return (
        /^(0|10|127)\./u.test(host) ||
        /^169\.254\./u.test(host) ||
        /^192\.168\./u.test(host) ||
        /^172\.(1[6-9]|2\d|3[01])\./u.test(host) ||
        host === '::' ||
        host === '::1' ||
        /^(fc|fd|fe[89ab])/iu.test(host)
    );
}

export function canonicalizeFeedUrl(value: string) {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const unsafe =
        !['http:', 'https:'].includes(url.protocol) ||
        Boolean(url.username || url.password) ||
        (url.port !== '' && !['80', '443'].includes(url.port)) ||
        blockedHosts.has(host) ||
        host.endsWith('.local') ||
        host.endsWith('.internal') ||
        unsafeIp(host);
    if (unsafe) throw new Error('UNSAFE_FEED_URL');
    url.hash = '';
    return url.toString();
}

function mapSource(row: Record<string, unknown>) {
    const nullableString = (value: unknown) =>
        typeof value === 'string' ? value : null;
    return {
        id: String(row.id),
        url: String(row.source_url),
        status: String(row.sync_status),
        lastSuccessAt: nullableString(row.last_sync_succeeded_at),
        nextAttemptAt: nullableString(row.next_sync_at),
        failureCount: Number(row.consecutive_failures),
        errorCode: nullableString(row.sync_error_code),
        fetchIntervalMinutes: Number(row.fetch_interval_minutes),
    };
}

export async function listRssSources(db: SupabaseClient, userId: string) {
    const result = await db
        .from('integration_connections')
        .select(
            'id,source_url,sync_status,last_sync_succeeded_at,next_sync_at,consecutive_failures,sync_error_code,fetch_interval_minutes',
        )
        .eq('user_id', userId)
        .eq('provider_id', 'rss')
        .is('disconnected_at', null)
        .order('created_at', { ascending: true });
    if (result.error) throw result.error;
    return (result.data ?? []).map((row) =>
        mapSource(row as Record<string, unknown>),
    );
}

export async function addRssSource(
    db: SupabaseClient,
    userId: string,
    input: unknown,
) {
    const parsed = rssSourceInputSchema.parse(input);
    const sourceUrl = canonicalizeFeedUrl(parsed.url);
    const sourceHash = createHash('sha256').update(sourceUrl).digest('hex');
    const result = await db
        .from('integration_connections')
        .upsert(
            {
                user_id: userId,
                provider_id: 'rss',
                external_account_id: sourceHash,
                source_url: sourceUrl,
                source_url_hash: sourceHash,
                fetch_interval_minutes: parsed.fetchIntervalMinutes,
                state: 'connected',
                sync_status: 'scheduled',
                next_sync_at: new Date().toISOString(),
                disabled_at: null,
                disconnected_at: null,
                scopes: ['feed.read'],
                metadata: { contentTrust: 'untrusted' },
            },
            {
                onConflict: 'user_id,provider_id,external_account_id',
            },
        )
        .select(
            'id,source_url,sync_status,last_sync_succeeded_at,next_sync_at,consecutive_failures,sync_error_code,fetch_interval_minutes',
        )
        .single();
    if (result.error) throw result.error;
    return mapSource(result.data as Record<string, unknown>);
}

export async function disableRssSource(
    db: SupabaseClient,
    userId: string,
    sourceId: string,
) {
    const result = await db
        .from('integration_connections')
        .update({
            state: 'disconnected',
            sync_status: 'disabled',
            disabled_at: new Date().toISOString(),
            next_sync_at: null,
        })
        .eq('id', sourceId)
        .eq('user_id', userId)
        .eq('provider_id', 'rss')
        .select('id')
        .maybeSingle();
    if (result.error) throw result.error;
    return result.data !== null;
}
