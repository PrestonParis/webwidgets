import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const viewFileCategorySchema = z.enum([
    'document',
    'image',
    'code',
    'data',
    'media',
    'canvas',
    'unknown',
]);

export const viewRenderStrategySchema = z.enum([
    'pdf_canvas',
    'markdown_html',
    'plain_text',
    'code_block',
    'image',
    'svg_sandbox',
    'csv_table',
    'json_tree',
    'yaml_text',
    'media_placeholder',
    'canvas_layers',
    'unsupported',
]);

export const viewFileRefSchema = z.object({
    id: z.string(),
    name: z.string(),
    mimeType: z.string(),
    sizeBytes: z.number().int().min(0),
    source: z
        .enum(['upload', 'remote', 'sample', 'generated'])
        .default('upload'),
    url: z.string().url().optional(),
    createdAt: z.string().datetime().optional(),
});

export const normalizedViewDocumentSchema = z.object({
    file: viewFileRefSchema,
    category: viewFileCategorySchema,
    strategy: viewRenderStrategySchema,
    metadata: z.record(z.string(), z.unknown()).default({}),
    searchableText: z.string().default(''),
    renderable: z.unknown(),
    analysisHints: z.array(z.string()).default([]),
    security: z.object({
        sanitized: z.boolean(),
        isolated: z.boolean(),
        maxPayloadBytes: z.number().int(),
        warnings: z.array(z.string()).default([]),
    }),
});

export const viewAnnotationSchema = z.object({
    id: z.string(),
    fileId: z.string(),
    kind: z.enum([
        'highlight',
        'comment',
        'shape',
        'freehand',
        'pin',
        'redaction',
    ]),
    layerId: z.string().optional(),
    range: z.object({ start: z.number(), end: z.number() }).optional(),
    geometry: z.record(z.string(), z.number()).optional(),
    text: z.string().optional(),
    color: z.string().default('#facc15'),
    createdAt: z.string().datetime(),
});

export const viewLayerSchema = z.object({
    id: z.string(),
    type: z.enum([
        'base',
        'annotation',
        'drawing',
        'analysis',
        'selection',
        'export',
    ]),
    name: z.string(),
    visible: z.boolean().default(true),
    locked: z.boolean().default(false),
    opacity: z.number().min(0).max(1).default(1),
    zIndex: z.number().int(),
    objects: z.array(z.record(z.string(), z.unknown())).default([]),
});

export const viewTransformSchema = z.object({
    id: z.string(),
    label: z.string(),
    kind: z.enum([
        'convert',
        'extract',
        'annotate',
        'resize',
        'sanitize',
        'summarize',
        'snapshot',
    ]),
    inputStrategies: z.array(viewRenderStrategySchema),
    outputFormat: z.string(),
    safe: z.boolean(),
});

export const viewExportRequestSchema = z.object({
    fileId: z.string(),
    format: z.enum([
        'png',
        'pdf',
        'markdown',
        'json',
        'csv',
        'txt',
        'snapshot',
    ]),
    destination: z.enum([
        'download',
        'email',
        'research_vault',
        'notes',
        'dashboard_widget',
        'timeline_event',
        'notification',
        'external_api',
        'cloud_storage',
    ]),
    includeAnnotations: z.boolean().default(true),
});

export const viewDocumentTable = pgTable('view_documents', {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    category: text('category').notNull(),
    metadata: jsonb('metadata').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const insertViewDocumentSchema = createInsertSchema(viewDocumentTable);
export const selectViewDocumentSchema = createSelectSchema(viewDocumentTable);

export type ViewFileCategory = z.infer<typeof viewFileCategorySchema>;
export type ViewRenderStrategy = z.infer<typeof viewRenderStrategySchema>;
export type ViewFileRef = z.infer<typeof viewFileRefSchema>;
export type NormalizedViewDocument = z.infer<
    typeof normalizedViewDocumentSchema
>;
export type ViewAnnotation = z.infer<typeof viewAnnotationSchema>;
export type ViewLayer = z.infer<typeof viewLayerSchema>;
export type ViewTransform = z.infer<typeof viewTransformSchema>;
export type ViewExportRequest = z.infer<typeof viewExportRequestSchema>;
