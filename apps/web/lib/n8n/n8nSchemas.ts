import { z } from 'zod';

const workflowKeySchema = z.enum([
    'email_ingestion',
    'calendar_sync',
    'finance_sync',
    'research_item_processing',
    'ml_enrichment',
    'weekly_summary',
    'recovery_check_in_analysis',
]);

export const n8nEnvSchema = z.object({
    N8N_BASE_URL: z.string().url().optional(),
    N8N_API_KEY: z.string().min(1).optional(),
    N8N_WEBHOOK_SECRET: z.string().min(16).optional(),
    N8N_WEBHOOK_USER_AGENT: z.string().min(1).optional(),
    N8N_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
});

export const n8nTriggerResponseSchema = z
    .object({
        runId: z.string().optional(),
        executionId: z.string().optional(),
        id: z.string().optional(),
        status: z.string().optional(),
    })
    .passthrough();

export const n8nTriggerResultSchema = z.object({
    ok: z.boolean(),
    workflowKey: z.string(),
    runId: z.string().optional(),
    error: z
        .object({
            code: z.enum([
                'N8N_TIMEOUT',
                'N8N_UNAUTHORIZED',
                'N8N_BAD_RESPONSE',
                'N8N_WEBHOOK_INVALID',
                'WORKFLOW_TRIGGER_FAILED',
                'N8N_NOT_CONFIGURED',
            ]),
            message: z.string(),
        })
        .optional(),
});

const basePayloadSchema = z.object({
    userId: z.string().min(1).optional(),
    idempotencyKey: z.string().min(1).optional(),
});

export const emailIngestedPayloadSchema = basePayloadSchema.extend({
    messageId: z.string().min(1),
    threadId: z.string().optional(),
    historyId: z.string().optional(),
    category: z.string().optional(),
    extractedActionCount: z.number().int().nonnegative().optional(),
});

export const calendarSyncedPayloadSchema = basePayloadSchema.extend({
    calendarId: z.string().optional(),
    eventCount: z.number().int().nonnegative().default(0),
    syncedAt: z.string(),
});

export const financeSyncedPayloadSchema = basePayloadSchema.extend({
    provider: z.string().optional(),
    accountCount: z.number().int().nonnegative().optional(),
    transactionCount: z.number().int().nonnegative().optional(),
    syncedAt: z.string(),
});

export const researchItemProcessedPayloadSchema = basePayloadSchema.extend({
    itemId: z.string().min(1),
    status: z.enum(['processed', 'failed']),
    summary: z.string().max(5000).optional(),
});

export const mlEnrichmentCompletedPayloadSchema = basePayloadSchema.extend({
    entityType: z.string().min(1),
    entityId: z.string().min(1),
    model: z.string().optional(),
    confidence: z.number().min(0).max(1).optional(),
});

export const n8nWebhookEventSchema = z.discriminatedUnion('type', [
    z.object({
        type: z.literal('email.ingested'),
        payload: emailIngestedPayloadSchema,
    }),
    z.object({
        type: z.literal('calendar.synced'),
        payload: calendarSyncedPayloadSchema,
    }),
    z.object({
        type: z.literal('finance.synced'),
        payload: financeSyncedPayloadSchema,
    }),
    z.object({
        type: z.literal('research.item_processed'),
        payload: researchItemProcessedPayloadSchema,
    }),
    z.object({
        type: z.literal('ml.enrichment_completed'),
        payload: mlEnrichmentCompletedPayloadSchema,
    }),
]);

export const workflowTriggerRequestSchema = z.object({
    workflowKey: workflowKeySchema,
    payload: z.record(z.string(), z.unknown()).default({}),
    idempotencyKey: z.string().optional(),
});

export const workflowPayloadSchemas = {
    email_ingestion: z.object({
        userId: z.string().min(1),
        source: z.enum(['gmail']),
        messageId: z.string().min(1).optional(),
    }),
    calendar_sync: z.object({
        userId: z.string().min(1),
        calendarId: z.string().optional(),
    }),
    finance_sync: z.object({
        userId: z.string().min(1),
        provider: z.string().optional(),
    }),
    research_item_processing: z.object({
        userId: z.string().min(1),
        itemId: z.string().min(1),
    }),
    ml_enrichment: z.object({
        userId: z.string().min(1),
        entityType: z.string().min(1),
        entityId: z.string().min(1),
    }),
    weekly_summary: z.object({
        userId: z.string().min(1),
        weekOf: z.string().optional(),
    }),
    recovery_check_in_analysis: z.object({
        userId: z.string().min(1),
        trackerId: z.string().optional(),
    }),
} satisfies Record<z.infer<typeof workflowKeySchema>, z.ZodType>;

export type WorkflowKey = z.infer<typeof workflowKeySchema>;
