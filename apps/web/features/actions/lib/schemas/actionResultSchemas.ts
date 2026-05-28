import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { boolean, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const actionErrorCodeSchema = z.enum([
    'ValidationError',
    'PermissionDenied',
    'UnknownAction',
    'QueueUnavailable',
    'ExecutionFault',
    'OutputMalformation',
]);

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

export type ActionEngineResult = z.infer<typeof actionEngineResultSchema>;
