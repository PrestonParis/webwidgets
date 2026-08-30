import { z } from 'zod';

const databaseTimestampSchema = z.iso.datetime({ offset: true });

export const briefingStatusSchema = z.enum([
    'queued',
    'generating',
    'ready',
    'partial',
    'empty',
    'stale',
    'failed',
]);
export const briefingTriggerSchema = z.enum(['daily', 'on_demand']);
export const briefingFeedbackRatingSchema = z.enum([
    'useful',
    'not_useful',
    'incorrect',
]);

export const createBriefingRequestSchema = z.object({
    windowHours: z.number().int().min(1).max(168).default(24),
});

export const workerBriefingRequestSchema = z.object({
    userId: z.string().uuid(),
    trigger: briefingTriggerSchema,
    coveredFrom: databaseTimestampSchema,
    coveredTo: databaseTimestampSchema,
    idempotencyKey: z.string().min(1).max(700),
});

export const generateBriefingRequestSchema = workerBriefingRequestSchema.extend(
    {
        jobId: z.string().uuid(),
        correlationId: z.string().min(1).max(200),
    },
);

export const briefingFeedbackRequestSchema = z.object({
    rating: briefingFeedbackRatingSchema,
    comment: z.string().trim().max(1_000).optional(),
});

export const briefingPreferencesRequestSchema = z.object({
    dailyEnabled: z.boolean(),
    localTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    timezone: z.string().min(1).max(100),
    windowHours: z.number().int().min(1).max(168),
});

const briefingEvidenceSchema = z.object({
    eventId: z.string().uuid(),
    title: z.string(),
    occurredAt: databaseTimestampSchema,
    sourceType: z.string(),
});

const briefingItemSchema = z.object({
    id: z.string().uuid(),
    section: z.enum(['changed', 'matters', 'due', 'review']),
    title: z.string(),
    summary: z.string(),
    confidence: z.number().min(0).max(1),
    evidence: z.array(briefingEvidenceSchema),
    feedback: briefingFeedbackRatingSchema.nullable(),
});

const briefingRecordSchema = z.object({
    id: z.string().uuid(),
    status: briefingStatusSchema,
    trigger: briefingTriggerSchema,
    coveredFrom: databaseTimestampSchema,
    coveredTo: databaseTimestampSchema,
    generatedAt: databaseTimestampSchema.nullable(),
    expiresAt: databaseTimestampSchema,
    modelProvider: z.string(),
    modelName: z.string(),
    modelVersion: z.string(),
    ruleVersion: z.string(),
    warnings: z.array(z.string()),
    inputEventCount: z.number().int().min(0),
    latencyMs: z.number().int().min(0).nullable(),
    estimatedCostUsd: z.number().min(0).nullable(),
    failureCode: z.string().nullable(),
    items: z.array(briefingItemSchema),
});

export const briefingResponseSchema = z.object({
    briefing: briefingRecordSchema.nullable(),
    preferences: briefingPreferencesRequestSchema,
    activeJobId: z.string().uuid().nullable(),
});
