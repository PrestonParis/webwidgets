import type { SupabaseClient } from '@supabase/supabase-js';
import type { NormalizedFeedItem } from './feedNormalize.js';
import { sha256 } from './feedNormalize.js';

export interface RssConnection {
    id: string;
    userId: string;
    sourceUrl: string;
    sourceUrlHash: string;
    etag: string | null;
    lastModified: string | null;
    fetchIntervalMinutes: number;
    disabled: boolean;
}

interface ConnectionRow {
    id: string;
    user_id: string;
    source_url: string;
    source_url_hash: string;
    http_etag: string | null;
    http_last_modified: string | null;
    fetch_interval_minutes: number;
    disabled_at: string | null;
    disconnected_at: string | null;
}

export class RssStore {
    constructor(private readonly client: SupabaseClient) {}

    async getConnection(userId: string, connectionId: string) {
        const result = await this.client
            .from('integration_connections')
            .select(
                'id,user_id,source_url,source_url_hash,http_etag,http_last_modified,fetch_interval_minutes,disabled_at,disconnected_at',
            )
            .eq('id', connectionId)
            .eq('user_id', userId)
            .eq('provider_id', 'rss')
            .maybeSingle();
        if (result.error) throw result.error;
        if (!result.data) return null;
        const row = result.data as ConnectionRow;
        return {
            id: row.id,
            userId: row.user_id,
            sourceUrl: row.source_url,
            sourceUrlHash: row.source_url_hash,
            etag: row.http_etag,
            lastModified: row.http_last_modified,
            fetchIntervalMinutes: row.fetch_interval_minutes,
            disabled: Boolean(row.disabled_at || row.disconnected_at),
        } satisfies RssConnection;
    }

    async markSyncing(connection: RssConnection) {
        await this.update(connection, {
            sync_status: 'syncing',
            last_sync_started_at: new Date().toISOString(),
            sync_error_code: null,
            sync_error_detail: null,
        });
    }

    async markSuccess(
        connection: RssConnection,
        response: { etag: string | null; lastModified: string | null },
    ) {
        const now = new Date();
        await this.update(connection, {
            state: 'connected',
            sync_status: 'healthy',
            last_checked_at: now.toISOString(),
            last_sync_succeeded_at: now.toISOString(),
            next_sync_at: new Date(
                now.valueOf() + connection.fetchIntervalMinutes * 60_000,
            ).toISOString(),
            consecutive_failures: 0,
            sync_error_code: null,
            sync_error_detail: null,
            http_etag: response.etag,
            http_last_modified: response.lastModified,
        });
    }

    async markFailure(connection: RssConnection, code: string, detail: string) {
        const result = await this.client
            .from('integration_connections')
            .select('consecutive_failures')
            .eq('id', connection.id)
            .eq('user_id', connection.userId)
            .single();
        if (result.error) throw result.error;
        const failures = Number(result.data.consecutive_failures) + 1;
        const delayMinutes = Math.min(360, 5 * 2 ** Math.min(failures - 1, 6));
        await this.update(connection, {
            state: 'error',
            sync_status: 'degraded',
            last_checked_at: new Date().toISOString(),
            next_sync_at: new Date(
                Date.now() + delayMinutes * 60_000,
            ).toISOString(),
            consecutive_failures: failures,
            sync_error_code: code,
            sync_error_detail: detail.slice(0, 500),
        });
    }

    async persistItem(connection: RssConnection, item: NormalizedFeedItem) {
        const observationKey = `rss:${connection.sourceUrlHash}:${sha256(item.sourceEventId)}`;
        const observation = await this.findOrInsertObservation(
            connection,
            item,
            observationKey,
        );
        const timelineKey = `${observationKey}:published`;
        const existing = await this.client
            .from('timeline_events')
            .select('id,content_hash,revision')
            .eq('user_id', connection.userId)
            .eq('idempotency_key', timelineKey)
            .maybeSingle();
        if (existing.error) throw existing.error;
        const metadata = {
            canonicalUrl: item.canonicalUrl,
            author: item.author,
            publisher: item.publisher,
            updatedAt: item.updatedAt,
            contentReference: item.canonicalUrl,
            extractionStatus: 'reference_only',
            relatedStoryKey: item.relatedStoryKey,
            untrustedExternalContent: true,
        };
        if (!existing.data) {
            const inserted = await this.client.from('timeline_events').insert({
                user_id: connection.userId,
                observation_id: observation.id,
                idempotency_key: timelineKey,
                event_type: 'rss.item.published',
                source_type: 'rss',
                source_record_table: 'integration_connections',
                source_record_id: connection.id,
                title: item.title,
                summary: item.summary,
                content_hash: item.contentHash,
                occurred_at: item.occurredAt,
                normalization_version: 'rss-v1',
                metadata,
            });
            if (inserted.error && inserted.error.code !== '23505') {
                throw inserted.error;
            }
        } else if (existing.data.content_hash !== item.contentHash) {
            const updated = await this.client
                .from('timeline_events')
                .update({
                    title: item.title,
                    summary: item.summary,
                    content_hash: item.contentHash,
                    occurred_at: item.occurredAt,
                    revision: Number(existing.data.revision) + 1,
                    state: 'corrected',
                    metadata,
                })
                .eq('id', existing.data.id)
                .eq('user_id', connection.userId)
                .eq('revision', existing.data.revision);
            if (updated.error) throw updated.error;
        }
        const normalized = await this.client
            .from('raw_observations')
            .update({
                status: 'normalized',
                normalized_at: new Date().toISOString(),
                normalization_version: 'rss-v1',
            })
            .eq('id', observation.id)
            .eq('user_id', connection.userId);
        if (normalized.error) throw normalized.error;
    }

    private async findOrInsertObservation(
        connection: RssConnection,
        item: NormalizedFeedItem,
        idempotencyKey: string,
    ) {
        const existing = await this.client
            .from('raw_observations')
            .select('id')
            .eq('user_id', connection.userId)
            .eq('idempotency_key', idempotencyKey)
            .maybeSingle();
        if (existing.error) throw existing.error;
        if (existing.data) return existing.data;
        const payload = {
            title: item.title,
            summary: item.summary,
            canonicalUrl: item.canonicalUrl,
            author: item.author,
            publisher: item.publisher,
            updatedAt: item.updatedAt,
        };
        const inserted = await this.client
            .from('raw_observations')
            .insert({
                user_id: connection.userId,
                integration_connection_id: connection.id,
                source_type: 'rss',
                source_key: `rss:${connection.sourceUrlHash}`,
                provider_object_id: item.sourceEventId,
                provider_version: 'rss-atom-v1',
                event_type: 'rss.item',
                idempotency_key: idempotencyKey,
                payload,
                payload_hash: sha256(JSON.stringify(payload)),
                occurred_at: item.occurredAt,
                metadata: { untrustedExternalContent: true },
            })
            .select('id')
            .single();
        if (!inserted.error) return inserted.data;
        if (inserted.error.code !== '23505') throw inserted.error;
        const duplicate = await this.client
            .from('raw_observations')
            .select('id')
            .eq('user_id', connection.userId)
            .eq('idempotency_key', idempotencyKey)
            .single();
        if (duplicate.error) throw duplicate.error;
        return duplicate.data;
    }

    private async update(
        connection: RssConnection,
        values: Record<string, unknown>,
    ) {
        const result = await this.client
            .from('integration_connections')
            .update(values)
            .eq('id', connection.id)
            .eq('user_id', connection.userId)
            .eq('provider_id', 'rss');
        if (result.error) throw result.error;
    }
}
