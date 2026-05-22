import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import superjson from 'superjson';
import { z } from 'zod';

export const actionCategorySchema = z.enum([
    'email',
    'calendar',
    'tasks',
    'tracking',
    'finance',
    'knowledge',
    'automation',
    'news',
    'system',
]);

export const providerScopeSchema = z.enum([
    'local',
    'email',
    'calendar',
    'news',
    'finance',
    'automation',
    'internal',
]);

export const destructiveLevelSchema = z.enum(['safe', 'warning', 'critical']);
export const queueabilitySchema = z.enum(['immediate', 'optional', 'required']);
export const mutabilitySchema = z.enum(['read-only', 'state-altering']);
export const approvalStateSchema = z.enum([
    'not_required',
    'required',
    'approved',
    'denied',
]);

export const actionRequestEnvelopeSchema = z.object({
    actionId: z.string(),
    sourceWidgetId: z.string().optional(),
    payload: z.unknown().default({}),
    approvalState: approvalStateSchema.default('required'),
    invocationMode: z.enum(['auto', 'sync', 'queued']).default('auto'),
    correlationId: z.string().optional(),
});

export const actionExecutionContextSchema = z.object({
    userId: z.string(),
    actionId: z.string(),
    requestId: z.string(),
    sourceWidgetId: z.string().optional(),
    approvalState: approvalStateSchema,
    invocationMode: z.enum(['auto', 'sync', 'queued']),
    startedAt: z.date(),
});

export const deferredActionResultSchema = z.object({
    status: z.literal('deferred'),
    actionId: z.string(),
    jobId: z.string(),
    queueName: z.string(),
    enqueuedAt: z.date(),
});

export const completedActionResultSchema = z.object({
    status: z.literal('completed'),
    actionId: z.string(),
    output: z.unknown(),
    durationMs: z.number(),
});

export const actionErrorCodeSchema = z.enum([
    'ValidationError',
    'PermissionDenied',
    'UnknownAction',
    'QueueUnavailable',
    'ExecutionFault',
    'OutputMalformation',
]);

export const failedActionResultSchema = z.object({
    status: z.literal('failed'),
    actionId: z.string().optional(),
    code: actionErrorCodeSchema,
    message: z.string(),
    durationMs: z.number().optional(),
});

export const actionEngineResultSchema = z.discriminatedUnion('status', [
    deferredActionResultSchema,
    completedActionResultSchema,
    failedActionResultSchema,
]);

export const queuedActionJobSchema = z.object({
    serializedEnvelope: z.string(),
    userId: z.string(),
    queuedAt: z.date(),
});

export const actionExecutionTable = pgTable('action_executions', {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    actionId: text('action_id').notNull(),
    sourceWidgetId: text('source_widget_id'),
    status: text('status').notNull(),
    queueable: boolean('queueable').notNull(),
    payload: jsonb('payload').notNull(),
    output: jsonb('output'),
    error: jsonb('error'),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const insertActionExecutionSchema =
    createInsertSchema(actionExecutionTable);
export const selectActionExecutionSchema =
    createSelectSchema(actionExecutionTable);

export function serializeActionPayload(value: unknown) {
    return superjson.stringify(value);
}

export function deserializeActionPayload(value: string) {
    return superjson.parse(value);
}

export type ActionCategory = z.infer<typeof actionCategorySchema>;
export type ProviderScope = z.infer<typeof providerScopeSchema>;
export type DestructiveLevel = z.infer<typeof destructiveLevelSchema>;
export type Queueability = z.infer<typeof queueabilitySchema>;
export type Mutability = z.infer<typeof mutabilitySchema>;
export type ApprovalState = z.infer<typeof approvalStateSchema>;
export type ActionRequestEnvelope = z.infer<typeof actionRequestEnvelopeSchema>;
export type ActionExecutionContext = z.infer<
    typeof actionExecutionContextSchema
>;
export type ActionEngineResult = z.infer<typeof actionEngineResultSchema>;
export type QueuedActionJob = z.infer<typeof queuedActionJobSchema>;
