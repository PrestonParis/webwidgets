import {
    candidateActionSchema,
    insightSchema,
    rawObservationSchema,
    timelineEventSchema,
} from './coreSchemas';
import type {
    CandidateAction,
    CanonicalTimelineEvent,
    Insight,
    RawObservation,
} from './types';

type Row = Record<string, unknown>;

export function mapRawObservation(row: Row): RawObservation {
    return rawObservationSchema.parse({
        id: row.id,
        userId: row.user_id,
        integrationConnectionId: row.integration_connection_id ?? null,
        sourceType: row.source_type,
        sourceKey: row.source_key,
        providerObjectId: row.provider_object_id,
        providerVersion: row.provider_version,
        eventType: row.event_type,
        idempotencyKey: row.idempotency_key,
        payload: row.payload,
        payloadHash: row.payload_hash,
        occurredAt: row.occurred_at,
        ingestedAt: row.ingested_at,
        normalizedAt: row.normalized_at ?? null,
        updatedAt: row.updated_at,
        normalizationVersion: row.normalization_version ?? null,
        status: row.status,
        failureCode: row.failure_code ?? null,
        failureDetail: row.failure_detail ?? null,
        payloadExpiresAt: row.payload_expires_at,
        payloadClearedAt: row.payload_cleared_at ?? null,
        metadata: row.metadata,
    });
}

export function mapTimelineEvent(row: Row): CanonicalTimelineEvent {
    return timelineEventSchema.parse({
        id: row.id,
        userId: row.user_id,
        observationId: row.observation_id,
        idempotencyKey: row.idempotency_key,
        eventType: row.event_type,
        sourceType: row.source_type,
        sourceRecordTable: row.source_record_table ?? null,
        sourceRecordId: row.source_record_id ?? null,
        title: row.title,
        summary: row.summary ?? null,
        contentHash: row.content_hash,
        occurredAt: row.occurred_at,
        ingestedAt: row.ingested_at,
        updatedAt: row.updated_at,
        normalizationVersion: row.normalization_version,
        revision: row.revision,
        state: row.state,
        metadata: row.metadata,
        expiresAt: row.expires_at,
        deletedAt: row.deleted_at ?? null,
    });
}

export function mapInsight(row: Row, evidenceIds: string[]): Insight {
    return insightSchema.parse({
        id: row.id,
        userId: row.user_id,
        primaryTimelineEventId: row.primary_timeline_event_id,
        evidenceTimelineEventIds: evidenceIds,
        idempotencyKey: row.idempotency_key,
        kind: row.kind,
        title: row.title,
        summary: row.summary,
        contentHash: row.content_hash,
        modelProvider: row.model_provider,
        modelName: row.model_name,
        modelVersion: row.model_version,
        policyVersion: row.policy_version,
        confidence: Number(row.confidence),
        state: row.state,
        failureCode: row.failure_code ?? null,
        failureDetail: row.failure_detail ?? null,
        expiresAt: row.expires_at,
        contentClearedAt: row.content_cleared_at ?? null,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}

export function mapCandidateAction(row: Row): CandidateAction {
    return candidateActionSchema.parse({
        id: row.id,
        userId: row.user_id,
        insightId: row.insight_id,
        idempotencyKey: row.idempotency_key,
        actionId: row.action_id,
        payload: row.payload,
        payloadHash: row.payload_hash,
        payloadVersion: row.payload_version,
        policyVersion: row.policy_version,
        confidence: Number(row.confidence),
        state: row.state,
        failureCode: row.failure_code ?? null,
        failureDetail: row.failure_detail ?? null,
        expiresAt: row.expires_at,
        contentClearedAt: row.content_cleared_at ?? null,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    });
}
