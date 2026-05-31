import { z } from 'zod';

export const contextNodeTypes = [
    'profile',
    'goal',
    'project',
    'widget',
    'widget_activity',
    'file',
    'document',
    'artifact',
    'chat',
    'chat_gist',
    'email',
    'calendar_event',
    'todo',
    'automation',
    'automation_run',
    'integration',
    'journal_entry',
    'mood_entry',
    'habit_entry',
    'recovery_entry',
    'recommendation',
    'insight',
    'memory',
    'agent_action',
    'import_export_object',
    'query_gist',
] as const;

export const contextEdgeKinds = [
    'explicit',
    'mentions',
    'relates_to',
    'belongs_to',
    'created_from',
    'derived_from',
    'summarizes',
    'depends_on',
    'blocks',
    'supports_goal',
    'scheduled_for',
    'assigned_to',
    'produced_by',
    'consumed_by',
    'triggered_by',
    'updated_by',
    'used_by',
    'duplicate_of',
    'contradicts',
    'same_project',
    'same_workflow',
    'temporal_next',
    'workflow',
    'category',
    'semantic',
    'temporal',
] as const;

export const contextCreatedByTypes = [
    'user',
    'system',
    'agent',
    'integration',
] as const;

export const contextStatuses = [
    'active',
    'archived',
    'stale',
    'deleted',
] as const;

export const contextVisibilityValues = [
    'private',
    'workspace',
    'shared',
    'public',
] as const;

export const contextScopeValues = [
    'private',
    'profile',
    'widget',
    'chat',
    'automation',
    'integration',
    'cross_widget',
    'ai',
    'export',
] as const;

const jsonRecord = z.record(z.string(), z.unknown());

export const contextPermissionsSchema = z.object({
    captureWidgetInteractions: z.boolean().default(true),
    captureChatMemory: z.boolean().default(true),
    captureFiles: z.boolean().default(true),
    captureDocuments: z.boolean().default(true),
    captureIntegrations: z.boolean().default(true),
    allowAIPersonalization: z.boolean().default(true),
    allowAutomationContextAccess: z.boolean().default(true),
    allowCrossWidgetContext: z.boolean().default(true),
    allowInferredRelationships: z.boolean().default(true),
});

export const contextPermissionCategorySchema = contextPermissionsSchema.keyof();

export const contextNodeSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().min(1),
    entityId: z.string().min(1),
    type: z.enum(contextNodeTypes),
    label: z.string().min(1),
    title: z.string().optional(),
    summary: z.string().optional().nullable(),
    data: jsonRecord.default({}),
    tags: z.array(z.string()).default([]),
    sourceType: z.string().min(1).default('manual'),
    sourceId: z.string().optional().nullable(),
    sourceTable: z.string().optional().nullable(),
    sourceCollection: z.string().optional().nullable(),
    createdBy: z.string().optional().nullable(),
    createdByType: z.enum(contextCreatedByTypes).default('user'),
    confidence: z.number().min(0).max(1).default(1),
    status: z.enum(contextStatuses).default('active'),
    visibility: z.enum(contextVisibilityValues).default('private'),
    permissions: z.array(z.enum(contextScopeValues)).default(['private']),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    lastObservedAt: z.string().optional().nullable(),
    lastVerifiedAt: z.string().optional().nullable(),
    metadata: jsonRecord.default({}),
});

export const contextNodeInputSchema = contextNodeSchema
    .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
    .partial({
        data: true,
        tags: true,
        sourceType: true,
        createdByType: true,
        confidence: true,
        status: true,
        visibility: true,
        permissions: true,
        metadata: true,
    });

export const contextEdgeSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().min(1),
    fromEntityId: z.string().min(1),
    toEntityId: z.string().min(1),
    kind: z.enum(contextEdgeKinds),
    label: z.string().optional().nullable(),
    weight: z.number().default(1),
    confidence: z.number().min(0).max(1).default(1),
    createdBy: z.string().optional().nullable(),
    createdByType: z.enum(contextCreatedByTypes).default('user'),
    sourceType: z.string().min(1).default('manual'),
    sourceId: z.string().optional().nullable(),
    metadata: jsonRecord.default({}),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const contextEdgeInputSchema = contextEdgeSchema
    .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
    .partial({
        label: true,
        weight: true,
        confidence: true,
        createdByType: true,
        sourceType: true,
        metadata: true,
    });

export const contextSavedViewSchema = z.object({
    id: z.string().uuid().optional(),
    userId: z.string().min(1),
    name: z.string().min(1).max(120),
    filters: jsonRecord.default({}),
    layoutMode: z.string().default('cluster'),
    focusNode: z.string().optional().nullable(),
    viewport: jsonRecord.default({}),
    visibleNodeTypes: z.array(z.enum(contextNodeTypes)).default([]),
    visibleEdgeKinds: z.array(z.enum(contextEdgeKinds)).default([]),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
});

export const contextSavedViewInputSchema = contextSavedViewSchema
    .omit({ id: true, userId: true, createdAt: true, updatedAt: true })
    .partial({
        filters: true,
        layoutMode: true,
        viewport: true,
        visibleNodeTypes: true,
        visibleEdgeKinds: true,
    });

export type CanonicalContextNode = z.infer<typeof contextNodeSchema>;
export type CanonicalContextNodeInput = z.infer<typeof contextNodeInputSchema>;
export type CanonicalContextEdge = z.infer<typeof contextEdgeSchema>;
export type CanonicalContextEdgeInput = z.infer<typeof contextEdgeInputSchema>;
export type ContextPermissionSettings = z.infer<
    typeof contextPermissionsSchema
>;
export type ContextPermissionCategory = z.infer<
    typeof contextPermissionCategorySchema
>;
export type ContextSavedView = z.infer<typeof contextSavedViewSchema>;
export type ContextSavedViewInput = z.infer<typeof contextSavedViewInputSchema>;

export const DEFAULT_CONTEXT_PERMISSIONS: ContextPermissionSettings =
    contextPermissionsSchema.parse({});
