import type { SupabaseClient } from '@supabase/supabase-js';
import type { Json } from '@/types/supabase';
import {
    rawObservationInputSchema,
    timelineEventInputSchema,
} from './coreSchemas';
import { buildObservationKey, hashJson } from './idempotency';
import { mapRawObservation, mapTimelineEvent } from './mappers';
import { assertMatchingHash, insertOrReadByKey } from './repositoryUtils';
import type {
    CanonicalTimelineEvent,
    RawObservation,
    RawObservationInput,
    TimelineEventInput,
} from './types';

function inDays(days: number): string {
    return new Date(Date.now() + days * 86_400_000).toISOString();
}

export async function recordRawObservation(
    db: SupabaseClient,
    input: RawObservationInput,
): Promise<RawObservation> {
    const parsed = rawObservationInputSchema.parse(input);
    const payloadHash = parsed.payloadHash ?? (await hashJson(parsed.payload));
    const idempotencyKey = parsed.idempotencyKey ?? buildObservationKey(parsed);
    const persisted = await insertOrReadByKey(
        db,
        'raw_observations',
        {
            user_id: parsed.userId,
            ...(parsed.integrationConnectionId && {
                integration_connection_id: parsed.integrationConnectionId,
            }),
            source_type: parsed.sourceType,
            source_key: parsed.sourceKey,
            provider_object_id: parsed.providerObjectId,
            provider_version: parsed.providerVersion,
            event_type: parsed.eventType,
            idempotency_key: idempotencyKey,
            payload: parsed.payload,
            payload_hash: payloadHash,
            occurred_at: parsed.occurredAt,
            metadata: parsed.metadata,
        },
        parsed.userId,
        idempotencyKey,
    );
    assertMatchingHash(
        persisted.row,
        'payload_hash',
        payloadHash,
        'Observation',
    );
    return mapRawObservation(persisted.row);
}

export async function markObservationNormalized(
    db: SupabaseClient,
    userId: string,
    observationId: string,
    normalizationVersion: string,
): Promise<RawObservation> {
    const result = await db
        .from('raw_observations')
        .update({
            status: 'normalized',
            normalized_at: new Date().toISOString(),
            normalization_version: normalizationVersion,
            failure_code: null,
            failure_detail: null,
        })
        .eq('user_id', userId)
        .eq('id', observationId)
        .select('*')
        .single();
    if (result.error) throw result.error;
    return mapRawObservation(result.data as Record<string, unknown>);
}

export async function upsertTimelineEvent(
    db: SupabaseClient,
    input: TimelineEventInput,
): Promise<CanonicalTimelineEvent> {
    const parsed = timelineEventInputSchema.parse(input);
    const content: Json = {
        eventType: parsed.eventType,
        sourceType: parsed.sourceType,
        sourceRecordTable: parsed.sourceRecordTable ?? null,
        sourceRecordId: parsed.sourceRecordId ?? null,
        title: parsed.title,
        summary: parsed.summary ?? null,
        occurredAt: parsed.occurredAt,
        normalizationVersion: parsed.normalizationVersion,
    };
    const contentHash = parsed.contentHash ?? (await hashJson(content));
    const existing = await db
        .from('timeline_events')
        .select('*')
        .eq('user_id', parsed.userId)
        .eq('idempotency_key', parsed.idempotencyKey)
        .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
        const current = mapTimelineEvent(
            existing.data as unknown as Record<string, unknown>,
        );
        if (current.contentHash === contentHash) {
            return current;
        }
        const updated = await db
            .from('timeline_events')
            .update({
                observation_id: parsed.observationId,
                source_record_table: parsed.sourceRecordTable ?? null,
                source_record_id: parsed.sourceRecordId ?? null,
                title: parsed.title,
                summary: parsed.summary ?? null,
                content_hash: contentHash,
                occurred_at: parsed.occurredAt,
                normalization_version: parsed.normalizationVersion,
                revision: current.revision + 1,
                state: 'corrected',
                metadata: parsed.metadata,
                ...(parsed.expiresAt && { expires_at: parsed.expiresAt }),
            })
            .eq('user_id', parsed.userId)
            .eq('id', current.id)
            .eq('revision', current.revision)
            .select('*')
            .single();
        if (updated.error) throw updated.error;
        return mapTimelineEvent(updated.data as Record<string, unknown>);
    }
    const inserted = await insertOrReadByKey(
        db,
        'timeline_events',
        {
            user_id: parsed.userId,
            observation_id: parsed.observationId,
            idempotency_key: parsed.idempotencyKey,
            event_type: parsed.eventType,
            source_type: parsed.sourceType,
            source_record_table: parsed.sourceRecordTable ?? null,
            source_record_id: parsed.sourceRecordId ?? null,
            title: parsed.title,
            summary: parsed.summary ?? null,
            content_hash: contentHash,
            occurred_at: parsed.occurredAt,
            normalization_version: parsed.normalizationVersion,
            metadata: parsed.metadata,
            expires_at: parsed.expiresAt ?? inDays(365),
        },
        parsed.userId,
        parsed.idempotencyKey,
    );
    assertMatchingHash(
        inserted.row,
        'content_hash',
        contentHash,
        'Timeline event',
    );
    return mapTimelineEvent(inserted.row);
}
