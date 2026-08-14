import { z } from 'zod';
import type { Json } from '@/types/supabase';

function isJson(value: unknown): value is Json {
    if (value === null) return true;
    if (['string', 'number', 'boolean'].includes(typeof value)) return true;
    if (Array.isArray(value)) return value.every(isJson);
    if (typeof value !== 'object') return false;
    return Object.values(value).every(
        (entry) => entry !== undefined && isJson(entry),
    );
}

export const jsonValueSchema = z.custom<Json>(isJson, 'Expected JSON data');
const metadataSchema = z.record(z.string(), jsonValueSchema);
const timestampSchema = z.string().datetime({ offset: true });

export const rawObservationSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    integrationConnectionId: z.string().uuid().nullable(),
    sourceType: z.string().min(1).max(120),
    sourceKey: z.string().min(1).max(300),
    providerObjectId: z.string().min(1).max(500),
    providerVersion: z.string().min(1).max(200),
    eventType: z.string().min(1).max(160),
    idempotencyKey: z.string().min(1).max(700),
    payload: jsonValueSchema,
    payloadHash: z.string().min(16).max(200),
    occurredAt: timestampSchema,
    ingestedAt: timestampSchema,
    normalizedAt: timestampSchema.nullable(),
    updatedAt: timestampSchema,
    normalizationVersion: z.string().nullable(),
    status: z.enum(['received', 'normalized', 'ignored', 'failed', 'deleted']),
    failureCode: z.string().nullable(),
    failureDetail: z.string().nullable(),
    payloadExpiresAt: timestampSchema,
    payloadClearedAt: timestampSchema.nullable(),
    metadata: metadataSchema,
});

export const rawObservationInputSchema = rawObservationSchema
    .pick({
        userId: true,
        integrationConnectionId: true,
        sourceType: true,
        sourceKey: true,
        providerObjectId: true,
        providerVersion: true,
        eventType: true,
        payload: true,
        occurredAt: true,
        metadata: true,
    })
    .extend({
        integrationConnectionId: z.string().uuid().optional(),
        idempotencyKey: z.string().min(1).max(700).optional(),
        payload: jsonValueSchema.default({}),
        payloadHash: z.string().min(16).max(200).optional(),
        metadata: metadataSchema.default({}),
    });

export const timelineEventSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    observationId: z.string().uuid(),
    idempotencyKey: z.string().min(1).max(700),
    eventType: z.string().min(1).max(160),
    sourceType: z.string().min(1).max(120),
    sourceRecordTable: z.string().nullable(),
    sourceRecordId: z.string().nullable(),
    title: z.string().min(1).max(500),
    summary: z.string().max(4000).nullable(),
    contentHash: z.string().min(16).max(200),
    occurredAt: timestampSchema,
    ingestedAt: timestampSchema,
    updatedAt: timestampSchema,
    normalizationVersion: z.string().min(1).max(200),
    revision: z.number().int().min(1),
    state: z.enum(['active', 'corrected', 'retracted', 'deleted']),
    metadata: metadataSchema,
    expiresAt: timestampSchema,
    deletedAt: timestampSchema.nullable(),
});

export const timelineEventInputSchema = timelineEventSchema
    .pick({
        userId: true,
        observationId: true,
        idempotencyKey: true,
        eventType: true,
        sourceType: true,
        title: true,
        occurredAt: true,
        normalizationVersion: true,
    })
    .extend({
        sourceRecordTable: z.string().min(1).optional(),
        sourceRecordId: z.string().min(1).optional(),
        summary: z.string().max(4000).optional(),
        contentHash: z.string().min(16).max(200).optional(),
        metadata: metadataSchema.default({}),
        expiresAt: timestampSchema.optional(),
    })
    .refine(
        (value) =>
            Boolean(value.sourceRecordTable) === Boolean(value.sourceRecordId),
        'Source table and ID must be supplied together',
    );

export const insightSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    primaryTimelineEventId: z.string().uuid(),
    evidenceTimelineEventIds: z.array(z.string().uuid()).min(1),
    idempotencyKey: z.string().min(1).max(700),
    kind: z.string().min(1).max(120),
    title: z.string().min(1).max(500),
    summary: z.string().max(8000),
    contentHash: z.string().min(16).max(200),
    modelProvider: z.string().min(1).max(120),
    modelName: z.string().min(1).max(200),
    modelVersion: z.string().min(1).max(200),
    policyVersion: z.string().min(1).max(200),
    confidence: z.number().min(0).max(1),
    state: z.enum(['active', 'dismissed', 'expired', 'superseded', 'failed']),
    failureCode: z.string().nullable(),
    failureDetail: z.string().nullable(),
    expiresAt: timestampSchema,
    contentClearedAt: timestampSchema.nullable(),
    metadata: metadataSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
});

export const insightInputSchema = insightSchema
    .pick({
        userId: true,
        evidenceTimelineEventIds: true,
        idempotencyKey: true,
        kind: true,
        title: true,
        summary: true,
        modelProvider: true,
        modelName: true,
        modelVersion: true,
        policyVersion: true,
        confidence: true,
        expiresAt: true,
    })
    .extend({
        contentHash: z.string().min(16).max(200).optional(),
        metadata: metadataSchema.default({}),
    });

export const candidateActionSchema = z.object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    insightId: z.string().uuid(),
    idempotencyKey: z.string().min(1).max(700),
    actionId: z.string().min(1).max(240),
    payload: jsonValueSchema,
    payloadHash: z.string().min(16).max(200),
    payloadVersion: z.number().int().min(1),
    policyVersion: z.string().min(1).max(200),
    confidence: z.number().min(0).max(1),
    state: z.enum([
        'proposed',
        'approved',
        'denied',
        'expired',
        'dismissed',
        'executing',
        'completed',
        'failed',
    ]),
    failureCode: z.string().nullable(),
    failureDetail: z.string().nullable(),
    expiresAt: timestampSchema,
    contentClearedAt: timestampSchema.nullable(),
    metadata: metadataSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
});

export const candidateActionInputSchema = candidateActionSchema
    .pick({
        userId: true,
        insightId: true,
        idempotencyKey: true,
        actionId: true,
        payload: true,
        payloadVersion: true,
        policyVersion: true,
        confidence: true,
        expiresAt: true,
    })
    .extend({
        payload: jsonValueSchema.default({}),
        payloadHash: z.string().min(16).max(200).optional(),
        payloadVersion: z.number().int().min(1).default(1),
        metadata: metadataSchema.default({}),
    });
