import { z } from 'zod';

export const V1_QUEUE_NAMES = {
    ingestion: 'v1-ingestion',
    analysis: 'v1-analysis',
    schedule: 'v1-schedule',
    action: 'v1-action',
} as const;

export type V1QueueKind = keyof typeof V1_QUEUE_NAMES;
export type V1QueueName = (typeof V1_QUEUE_NAMES)[V1QueueKind];

export const v1QueueKindSchema = z.enum([
    'ingestion',
    'analysis',
    'schedule',
    'action',
]);

export const v1TaskSchema = z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('runtime.probe') }),
    z.object({
        kind: z.literal('rss.fetch'),
        connectionId: z.string().uuid(),
    }),
    z.object({
        kind: z.literal('provider.sync'),
        connectionId: z.string().uuid(),
    }),
    z.object({
        kind: z.literal('briefing.generate'),
        trigger: z.enum(['daily', 'on_demand']),
        coveredFrom: z.string().datetime(),
        coveredTo: z.string().datetime(),
    }),
]);

export const v1JobEnvelopeSchema = z.object({
    version: z.literal(1),
    jobId: z.string().uuid(),
    userId: z.string().uuid(),
    correlationId: z.string().min(1).max(200),
    idempotencyKey: z.string().min(1).max(700),
    queue: v1QueueKindSchema,
    task: v1TaskSchema,
});

export type V1JobEnvelope = z.infer<typeof v1JobEnvelopeSchema>;
export type V1Task = z.infer<typeof v1TaskSchema>;

export const TERMINAL_JOB_STATUSES = [
    'completed',
    'cancelled',
    'dead_lettered',
] as const;

export type TerminalJobStatus = (typeof TERMINAL_JOB_STATUSES)[number];
export type DurableJobStatus =
    | 'queued'
    | 'running'
    | 'waiting'
    | 'failed'
    | TerminalJobStatus;

export interface DurableJobRecord {
    id: string;
    userId: string;
    status: DurableJobStatus;
    idempotencyKey: string;
    correlationId: string;
    queueName: string;
    queueJobId: string;
    retryCount: number;
    maxAttempts: number;
}

export type JsonValue =
    | boolean
    | number
    | string
    | null
    | JsonValue[]
    | { [key: string]: JsonValue | undefined };

export interface JobFailure {
    code: string;
    detail: string;
    retryable: boolean;
}
