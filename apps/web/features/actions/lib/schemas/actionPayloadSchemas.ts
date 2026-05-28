import superjson from 'superjson';
import { z } from 'zod';
import { approvalStateSchema } from './actionEnumSchemas';

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

export const queuedActionJobSchema = z.object({
    serializedEnvelope: z.string(),
    userId: z.string(),
    queuedAt: z.date(),
});

export function serializeActionPayload(value: unknown) {
    return superjson.stringify(value);
}

export function deserializeActionPayload(value: string) {
    return superjson.parse(value);
}

export type ActionRequestEnvelope = z.infer<typeof actionRequestEnvelopeSchema>;
export type ActionExecutionContext = z.infer<
    typeof actionExecutionContextSchema
>;
export type QueuedActionJob = z.infer<typeof queuedActionJobSchema>;
