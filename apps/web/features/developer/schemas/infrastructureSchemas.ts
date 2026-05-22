import { z } from 'zod';

export const diagnosticStatusSchema = z.enum([
    'healthy',
    'degraded',
    'unhealthy',
    'unavailable',
    'unknown',
]);

export const unavailableReasonSchema = z.enum([
    'not_configured',
    'permission_required',
    'integration_missing',
    'endpoint_missing',
    'runtime_unreachable',
    'adapter_not_implemented',
]);

export const diagnosticCheckSchema = z.object({
    id: z.string(),
    label: z.string(),
    status: diagnosticStatusSchema,
    source: z.string(),
    detail: z.string().optional(),
    latencyMs: z.number().optional(),
    checkedAt: z.string(),
    unavailableReason: unavailableReasonSchema.optional(),
});

export const routeDefinitionSchema = z.object({
    path: z.string(),
    methods: z.array(z.string()),
    file: z.string(),
});

export const environmentVariableSchema = z.object({
    name: z.string(),
    required: z.boolean(),
    configured: z.boolean(),
    malformed: z.boolean().default(false),
    scope: z.enum(['public', 'server', 'secret']),
    provider: z.string().optional(),
});

export const providerHealthSchema = z.object({
    id: z.string(),
    label: z.string(),
    status: diagnosticStatusSchema,
    authState: z.enum(['connected', 'not_configured', 'unknown']),
    detail: z.string().optional(),
    quota: z.string().optional(),
    checkedAt: z.string(),
});

export const queueSnapshotSchema = z.object({
    name: z.string(),
    status: diagnosticStatusSchema,
    adapter: z.string(),
    counts: z
        .object({
            waiting: z.number(),
            active: z.number(),
            completed: z.number(),
            failed: z.number(),
            delayed: z.number(),
            paused: z.number(),
        })
        .optional(),
    detail: z.string().optional(),
    checkedAt: z.string(),
    unavailableReason: unavailableReasonSchema.optional(),
});

export const cronJobDefinitionSchema = z.object({
    id: z.string(),
    source: z.string(),
    schedule: z.string().optional(),
    endpoint: z.string().optional(),
    status: diagnosticStatusSchema,
    detail: z.string().optional(),
});

export const containerSnapshotSchema = z.object({
    id: z.string(),
    name: z.string(),
    image: z.string(),
    status: diagnosticStatusSchema,
    state: z.string().optional(),
    ports: z.array(z.string()).default([]),
    uptime: z.string().optional(),
    checkedAt: z.string(),
});

export const schemaTableSchema = z.object({
    schema: z.string(),
    name: z.string(),
    columns: z.array(
        z.object({
            name: z.string(),
            type: z.string(),
            nullable: z.boolean(),
            defaultValue: z.string().optional(),
        }),
    ),
    relationships: z.array(
        z.object({
            column: z.string(),
            referencesTable: z.string(),
            referencesColumn: z.string(),
        }),
    ),
    policies: z.array(z.string()).default([]),
    indexes: z.array(z.string()).default([]),
});

export const schemaSnapshotSchema = z.object({
    status: diagnosticStatusSchema,
    source: z.string(),
    tables: z.array(schemaTableSchema),
    detail: z.string().optional(),
    checkedAt: z.string(),
    unavailableReason: unavailableReasonSchema.optional(),
});

export const metricsSnapshotSchema = z.object({
    status: diagnosticStatusSchema,
    source: z.string(),
    prometheusText: z.string().optional(),
    process: z
        .object({
            uptimeSeconds: z.number(),
            memoryRssBytes: z.number(),
            memoryHeapUsedBytes: z.number(),
            memoryHeapTotalBytes: z.number(),
        })
        .optional(),
    checkedAt: z.string(),
    detail: z.string().optional(),
});

export const logSourceSchema = z.object({
    id: z.string(),
    label: z.string(),
    status: diagnosticStatusSchema,
    source: z.string(),
    detail: z.string().optional(),
    unavailableReason: unavailableReasonSchema.optional(),
});

export const requestDiagnosticsSchema = z.object({
    orchestrator: diagnosticCheckSchema,
    deduplication: diagnosticCheckSchema,
    browserPerformanceAvailable: z.boolean(),
});

export const featureFlagSchema = z.object({
    id: z.string(),
    key: z.string(),
    description: z.string().nullable().optional(),
    enabled: z.boolean(),
    rollout_pct: z.number(),
    updated_at: z.string().nullable().optional(),
});

export const developerWorkspaceSnapshotSchema = z.object({
    generatedAt: z.string(),
    overview: z.array(diagnosticCheckSchema),
    routes: z.array(routeDefinitionSchema),
    environment: z.array(environmentVariableSchema),
    providers: z.array(providerHealthSchema),
    queues: z.array(queueSnapshotSchema),
    cronJobs: z.array(cronJobDefinitionSchema),
    containers: z.array(containerSnapshotSchema),
    schema: schemaSnapshotSchema,
    metrics: metricsSnapshotSchema,
    logs: z.array(logSourceSchema),
    requests: requestDiagnosticsSchema,
    featureFlags: z.array(featureFlagSchema),
    audit: z.array(z.string()),
});

export const apiTesterRequestSchema = z.object({
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    path: z.string().min(1),
    headers: z.record(z.string(), z.string()).default({}),
    query: z.record(z.string(), z.string()).default({}),
    body: z.string().optional(),
    includeCredentials: z.boolean().default(true),
    confirmedDestructive: z.boolean().default(false),
});

export const apiTesterResponseSchema = z.object({
    status: z.number(),
    statusText: z.string(),
    durationMs: z.number(),
    headers: z.record(z.string(), z.string()),
    bodyText: z.string(),
    contentType: z.string().nullable(),
});

export type DiagnosticStatus = z.infer<typeof diagnosticStatusSchema>;
export type DiagnosticCheck = z.infer<typeof diagnosticCheckSchema>;
export type RouteDefinition = z.infer<typeof routeDefinitionSchema>;
export type EnvironmentVariable = z.infer<typeof environmentVariableSchema>;
export type ProviderHealth = z.infer<typeof providerHealthSchema>;
export type QueueSnapshot = z.infer<typeof queueSnapshotSchema>;
export type CronJobDefinition = z.infer<typeof cronJobDefinitionSchema>;
export type ContainerSnapshot = z.infer<typeof containerSnapshotSchema>;
export type SchemaSnapshot = z.infer<typeof schemaSnapshotSchema>;
export type SchemaTable = z.infer<typeof schemaTableSchema>;
export type MetricsSnapshot = z.infer<typeof metricsSnapshotSchema>;
export type LogSource = z.infer<typeof logSourceSchema>;
export type FeatureFlag = z.infer<typeof featureFlagSchema>;
export type DeveloperWorkspaceSnapshot = z.infer<
    typeof developerWorkspaceSnapshotSchema
>;
export type ApiTesterRequest = z.infer<typeof apiTesterRequestSchema>;
export type ApiTesterResponse = z.infer<typeof apiTesterResponseSchema>;
