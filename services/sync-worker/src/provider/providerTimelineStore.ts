import type { SupabaseClient } from '@supabase/supabase-js';
import {
    minimizedSignalPayload,
    providerHash,
    signalContentHash,
    signalIdentity,
    signalOccurredAt,
} from './providerNormalize.js';
import type { ProviderConnection, ProviderSignal } from './providerTypes.js';

export class ProviderTimelineStore {
    constructor(private readonly client: SupabaseClient) {}

    async persistSignal(
        connection: ProviderConnection,
        signal: ProviderSignal,
    ) {
        const identity = signalIdentity(connection.id, signal);
        const payload = minimizedSignalPayload(signal);
        const observation = await this.findOrInsertObservation(
            connection,
            signal,
            identity,
            payload,
        );
        await this.findOrInsertTimeline(
            connection,
            signal,
            observation.id,
            identity.timelineKey,
        );
        await this.persistInboxProjection(connection, signal);
        const normalized = await this.client
            .from('raw_observations')
            .update({
                status: 'normalized',
                normalized_at: new Date().toISOString(),
                normalization_version: 'provider-signals-v1',
            })
            .eq('id', observation.id)
            .eq('user_id', connection.userId);
        if (normalized.error) throw normalized.error;
    }

    private async findOrInsertObservation(
        connection: ProviderConnection,
        signal: ProviderSignal,
        identity: ReturnType<typeof signalIdentity>,
        payload: ReturnType<typeof minimizedSignalPayload>,
    ): Promise<{ id: string }> {
        const existing = await this.client
            .from('raw_observations')
            .select('id')
            .eq('user_id', connection.userId)
            .eq('idempotency_key', identity.observationKey)
            .maybeSingle();
        if (existing.error) throw existing.error;
        if (existing.data) return existing.data as { id: string };
        const inserted = await this.client
            .from('raw_observations')
            .insert({
                user_id: connection.userId,
                integration_connection_id: connection.id,
                source_type: signal.provider,
                source_key: identity.sourceKey,
                provider_object_id: signal.objectId,
                provider_version: signal.providerVersion.slice(0, 200),
                event_type: `${signal.kind}.${signal.change}`,
                idempotency_key: identity.observationKey,
                payload,
                payload_hash: providerHash(JSON.stringify(payload)),
                occurred_at: signalOccurredAt(signal),
                metadata: { accountEmail: connection.accountEmail },
            })
            .select('id')
            .single();
        if (!inserted.error) return inserted.data as { id: string };
        if (inserted.error.code !== '23505') throw inserted.error;
        const duplicate = await this.client
            .from('raw_observations')
            .select('id')
            .eq('user_id', connection.userId)
            .eq('idempotency_key', identity.observationKey)
            .single();
        if (duplicate.error) throw duplicate.error;
        return duplicate.data as { id: string };
    }

    private async findOrInsertTimeline(
        connection: ProviderConnection,
        signal: ProviderSignal,
        observationId: string,
        timelineKey: string,
    ) {
        const existing = await this.client
            .from('timeline_events')
            .select('id,content_hash,revision')
            .eq('user_id', connection.userId)
            .eq('idempotency_key', timelineKey)
            .maybeSingle();
        if (existing.error) throw existing.error;
        const contentHash = signalContentHash(signal);
        if (existing.data?.content_hash === contentHash) return;
        const values = timelineValues(
            connection,
            signal,
            observationId,
            contentHash,
        );
        if (!existing.data) {
            const inserted = await this.client.from('timeline_events').insert({
                ...values,
                idempotency_key: timelineKey,
            });
            if (inserted.error && inserted.error.code !== '23505')
                throw inserted.error;
            return;
        }
        const updated = await this.client
            .from('timeline_events')
            .update({
                ...values,
                revision: Number(existing.data.revision) + 1,
            })
            .eq('id', existing.data.id)
            .eq('user_id', connection.userId)
            .eq('revision', existing.data.revision);
        if (updated.error) throw updated.error;
    }

    private async persistInboxProjection(
        connection: ProviderConnection,
        signal: ProviderSignal,
    ) {
        if (signal.kind !== 'email') return;
        const snapshotId = `${signal.provider}:${signal.objectId}`;
        if (signal.change === 'deleted') {
            const removed = await this.client
                .from('email_snapshots')
                .delete()
                .eq('user_id', connection.userId)
                .eq('account_email', connection.accountEmail)
                .eq('id', snapshotId);
            if (removed.error) throw removed.error;
            return;
        }
        const snapshot = await this.client.from('email_snapshots').upsert(
            {
                id: snapshotId,
                user_id: connection.userId,
                account_email: connection.accountEmail,
                provider: signal.provider,
                subject: signal.subject ?? '(no subject)',
                sender_email: signal.senderEmail ?? '',
                sender_name: signal.senderName ?? '',
                snippet: signal.snippet ?? '',
                received_at: signal.occurredAt,
                raw_date: signal.occurredAt,
                synced_at: new Date().toISOString(),
            },
            { onConflict: 'user_id,id' },
        );
        if (snapshot.error) throw snapshot.error;
        if (signal.provider === 'gmail') {
            const queued = await this.client.from('email_queue').upsert(
                {
                    user_id: connection.userId,
                    message_id: signal.objectId,
                    thread_id: signal.threadId,
                    history_id: signal.providerVersion,
                    status: 'pending',
                    stage: 'ingest',
                },
                {
                    onConflict: 'user_id,message_id',
                    ignoreDuplicates: true,
                },
            );
            if (queued.error) throw queued.error;
        }
    }
}

function timelineValues(
    connection: ProviderConnection,
    signal: ProviderSignal,
    observationId: string,
    contentHash: string,
) {
    const cancelled =
        signal.change === 'deleted' || signal.change === 'cancelled';
    const title =
        signal.kind === 'email'
            ? (signal.subject ?? 'Email removed')
            : (signal.title ?? 'Calendar event cancelled');
    const summary = signal.kind === 'email' ? signal.snippet : null;
    return {
        user_id: connection.userId,
        observation_id: observationId,
        event_type: `${signal.kind}.${signal.change}`,
        source_type: signal.provider,
        source_record_table: 'integration_connections',
        source_record_id: connection.id,
        title,
        summary,
        content_hash: contentHash,
        occurred_at: signalOccurredAt(signal),
        normalization_version: 'provider-signals-v1',
        state: cancelled ? 'retracted' : 'active',
        metadata: {
            accountEmail: connection.accountEmail,
            connectionId: connection.id,
            providerObjectId: signal.objectId,
            provider: signal.provider,
            syncedAt: new Date().toISOString(),
            ...(signal.kind === 'email'
                ? {
                      threadId: signal.threadId,
                      isRead: signal.isRead,
                      contentReference: signal.webLink,
                  }
                : {
                      start: signal.start,
                      end: signal.end,
                      allDay: signal.allDay,
                      calendarId: signal.calendarId,
                      location: signal.location,
                      contentReference: signal.webLink,
                  }),
        },
    };
}
