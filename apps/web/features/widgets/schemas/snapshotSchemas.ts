import { z } from 'zod';

export const widgetManifestSchema = z.object({
    id: z.string().min(1),
    feature: z.string().min(1),
    title: z.string().min(1),
    dataNeeds: z.array(z.string().min(1)),
    permissions: z.array(z.string()).optional(),
    refreshPolicy: z
        .enum(['static', 'on-load', 'background', 'realtime'])
        .optional(),
    fallbackMode: z
        .enum(['empty', 'stale-cache', 'skeleton', 'error-card'])
        .optional(),
});

export const widgetErrorSchema = z.object({
    code: z.string(),
    message: z.string(),
});

export const widgetSnapshotSchema = z.object({
    widgetId: z.string(),
    status: z.enum(['ready', 'loading', 'error', 'empty', 'stale']),
    data: z.unknown().optional(),
    error: widgetErrorSchema.optional(),
    generatedAt: z.string(),
    staleAt: z.string().optional(),
});

export const screenSnapshotSchema = z.object({
    screen: z.string(),
    widgets: z.record(z.string(), widgetSnapshotSchema),
    shared: z.record(z.string(), z.unknown()).optional(),
    generatedAt: z.string(),
});

export const resolverContextSchema = z.object({
    screen: z.string(),
    userId: z.string().optional(),
    requestId: z.string().optional(),
    activeWidgetIds: z.array(z.string()),
    params: z.record(z.string(), z.unknown()).optional(),
});
