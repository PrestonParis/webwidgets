import { z } from 'zod';
import { capabilityResultSchema } from './capabilities';
import {
    contractVersionSchema,
    contentHashSchema,
    identifierSchema,
    timestampSchema,
} from './primitives';

const eventBase = {
    contractVersion: contractVersionSchema,
    eventId: z.string().uuid(),
    objectiveId: z.string().uuid(),
    userId: z.string().uuid(),
    correlationId: z.string().min(1).max(300),
    sequence: z.number().int().min(1),
    ownershipEpoch: z.number().int().min(1),
    occurredAt: timestampSchema,
};

export const automationEventSchema = z.discriminatedUnion('eventType', [
    z
        .object({
            ...eventBase,
            eventType: z.literal('objective.submitted'),
            objectiveVersionId: z.string().uuid(),
        })
        .strict(),
    z
        .object({
            ...eventBase,
            eventType: z.literal('step.ready'),
            runId: z.string().uuid(),
            planId: z.string().uuid(),
            stepId: z.string().uuid(),
        })
        .strict(),
    z
        .object({
            ...eventBase,
            eventType: z.literal('approval.resolved'),
            runId: z.string().uuid(),
            stepId: z.string().uuid(),
            approvalId: z.string().uuid(),
            approvalStatus: z.enum([
                'approved',
                'denied',
                'expired',
                'revoked',
            ]),
            payloadHash: contentHashSchema,
            payloadVersion: z.number().int().min(1),
        })
        .strict(),
    z
        .object({
            ...eventBase,
            eventType: z.literal('provider.callback_received'),
            runId: z.string().uuid(),
            attemptId: z.string().uuid(),
            result: capabilityResultSchema,
        })
        .strict(),
    z
        .object({
            ...eventBase,
            eventType: z.literal('timer.elapsed'),
            runId: z.string().uuid(),
            stepId: z.string().uuid(),
            timerKey: z.string().min(1).max(300),
            scheduledFor: timestampSchema,
        })
        .strict(),
    z
        .object({
            ...eventBase,
            eventType: z.literal('cancellation.requested'),
            expectedStateVersion: z.number().int().min(1),
            reasonCode: identifierSchema,
        })
        .strict(),
    z
        .object({
            ...eventBase,
            eventType: z.literal('verification.requested'),
            runId: z.string().uuid(),
            effectId: z.string().uuid(),
            verifierName: identifierSchema,
            verifierVersion: z.string().min(1).max(200),
        })
        .strict(),
    z
        .object({
            ...eventBase,
            eventType: z.literal('plan.revision_created'),
            previousPlanId: z.string().uuid(),
            planId: z.string().uuid(),
            revisionReason: z.string().min(1).max(2000),
        })
        .strict(),
]);

export type AutomationEvent = z.infer<typeof automationEventSchema>;
