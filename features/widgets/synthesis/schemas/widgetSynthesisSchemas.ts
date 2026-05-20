import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const customApiSourceConfigSchema = z.object({
    name: z.string().min(1).max(80),
    baseUrl: z.string().url(),
    endpoint: z.string().default('/'),
    method: z.enum(['GET', 'POST']).default('GET'),
    headers: z.record(z.string(), z.string()).default({}),
    queryParams: z.record(z.string(), z.string()).default({}),
    bodyTemplate: z.record(z.string(), z.unknown()).optional(),
    auth: z
        .object({
            type: z
                .enum([
                    'none',
                    'api_key',
                    'bearer_token',
                    'oauth_future',
                    'user_secret_future',
                ])
                .default('none'),
            headerName: z.string().optional(),
            secretRef: z.string().optional(),
        })
        .default({ type: 'none' }),
    refreshIntervalSeconds: z.number().int().min(60).max(86_400).default(900),
    responseSchema: z.record(z.string(), z.string()).default({}),
    sampleResponse: z.unknown(),
    mappingRules: z
        .array(
            z.object({
                from: z.string(),
                to: z.string(),
                type: z.string(),
            }),
        )
        .default([]),
    rateLimit: z
        .object({
            requests: z.number().int().min(1).max(120),
            intervalSeconds: z.number().int().min(1).max(3600),
        })
        .default({ requests: 30, intervalSeconds: 60 }),
});

export const widgetSynthesisEventSchema = z.object({
    type: z.enum([
        'search_query',
        'selected_widget',
        'rejected_widget',
        'generated_draft',
        'missing_capability',
        'user_modified',
        'saved_widget',
        'deleted_widget',
        'failed_preview',
        'successful_preview',
    ]),
    query: z.string().optional(),
    widgetId: z.string().optional(),
    metadata: z.record(z.string(), z.unknown()).default({}),
    occurredAt: z.string().datetime(),
});

export const synthesizedWidgetTable = pgTable('synthesized_widgets', {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    kind: text('kind').notNull(),
    definition: jsonb('definition').notNull(),
    version: integer('version').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const insertSynthesizedWidgetSchema = createInsertSchema(
    synthesizedWidgetTable,
);
export const selectSynthesizedWidgetSchema = createSelectSchema(
    synthesizedWidgetTable,
);

export type CustomApiSourceConfigInput = z.infer<
    typeof customApiSourceConfigSchema
>;
export type WidgetSynthesisEvent = z.infer<typeof widgetSynthesisEventSchema>;
