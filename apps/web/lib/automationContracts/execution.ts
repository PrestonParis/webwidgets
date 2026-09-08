import { z } from 'zod';
import { automationErrorSchema } from './errors';
import {
    contentHashSchema,
    contractVersionSchema,
    identifierSchema,
    jsonObjectSchema,
    nullableTimestampSchema,
    timestampSchema,
} from './primitives';

export const objectiveRunSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        objectiveId: z.string().uuid(),
        planId: z.string().uuid(),
        budgetId: z.string().uuid(),
        userId: z.string().uuid(),
        automationRunId: z.string().uuid().nullable(),
        jobId: z.string().uuid().nullable(),
        runNumber: z.number().int().min(1),
        status: z.enum([
            'queued',
            'leased',
            'running',
            'paused',
            'blocked',
            'cancel_requested',
            'cancelled',
            'succeeded',
            'failed',
        ]),
        ownershipEpoch: z.number().int().min(1),
        leaseOwner: z.string().min(1).max(300).nullable(),
        leaseExpiresAt: nullableTimestampSchema,
        startedAt: nullableTimestampSchema,
        completedAt: nullableTimestampSchema,
        cancellationRequestedAt: nullableTimestampSchema,
        error: automationErrorSchema.nullable(),
        createdAt: timestampSchema,
        updatedAt: timestampSchema,
    })
    .strict();

export const objectiveStepAttemptSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        runId: z.string().uuid(),
        planId: z.string().uuid(),
        objectiveId: z.string().uuid(),
        stepId: z.string().uuid(),
        userId: z.string().uuid(),
        attemptNumber: z.number().int().min(1),
        idempotencyKey: z.string().min(1).max(500),
        executorVersion: z.string().min(1).max(200),
        status: z.enum([
            'queued',
            'leased',
            'running',
            'succeeded',
            'failed',
            'cancelled',
        ]),
        ownershipEpoch: z.number().int().min(1),
        leaseOwner: z.string().min(1).max(300).nullable(),
        leaseExpiresAt: nullableTimestampSchema,
        startedAt: nullableTimestampSchema,
        completedAt: nullableTimestampSchema,
        failureCode: identifierSchema.nullable(),
        createdAt: timestampSchema,
        updatedAt: timestampSchema,
    })
    .strict();

export const objectiveStepResultSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        attemptId: z.string().uuid(),
        runId: z.string().uuid(),
        objectiveId: z.string().uuid(),
        userId: z.string().uuid(),
        status: z.enum(['succeeded', 'failed', 'cancelled', 'unknown']),
        output: jsonObjectSchema.nullable(),
        outputHash: contentHashSchema.nullable(),
        error: automationErrorSchema.nullable(),
        providerExecutionId: z.string().min(1).max(500).nullable(),
        startedAt: timestampSchema,
        completedAt: timestampSchema,
        createdAt: timestampSchema,
    })
    .strict()
    .superRefine((value, context) => {
        if (
            value.status === 'succeeded' &&
            (value.output === null || value.outputHash === null)
        ) {
            context.addIssue({
                code: 'custom',
                path: ['output'],
                message: 'Successful results require output and its hash',
            });
        }
        if (value.status === 'failed' && value.error === null) {
            context.addIssue({
                code: 'custom',
                path: ['error'],
                message: 'Failed results require a canonical error',
            });
        }
    });

export const externalEffectSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        attemptId: z.string().uuid(),
        runId: z.string().uuid(),
        objectiveId: z.string().uuid(),
        userId: z.string().uuid(),
        actionRequestId: z.string().uuid().nullable(),
        actionResultId: z.string().uuid().nullable(),
        providerId: identifierSchema,
        providerExecutionId: z.string().min(1).max(500).nullable(),
        idempotencyKey: z.string().min(1).max(500),
        payloadHash: contentHashSchema,
        state: z.enum([
            'reserved',
            'dispatched',
            'accepted',
            'verified',
            'unknown',
            'compensating',
            'compensated',
            'failed',
        ]),
        reservationExpiresAt: timestampSchema,
        dispatchedAt: nullableTimestampSchema,
        acceptedAt: nullableTimestampSchema,
        verifiedAt: nullableTimestampSchema,
        lastError: automationErrorSchema.nullable(),
        createdAt: timestampSchema,
        updatedAt: timestampSchema,
    })
    .strict();

export const executionEvidenceSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        objectiveId: z.string().uuid(),
        runId: z.string().uuid(),
        userId: z.string().uuid(),
        evidenceType: z.enum([
            'plan_snapshot',
            'policy_decision',
            'approval',
            'step_result',
            'external_receipt',
            'verification',
            'completion',
            'failure',
        ]),
        subjectType: z.enum([
            'objective',
            'plan',
            'run',
            'step',
            'attempt',
            'effect',
        ]),
        subjectId: z.string().uuid(),
        content: jsonObjectSchema,
        contentHash: contentHashSchema,
        source: identifierSchema,
        recordedAt: timestampSchema,
        retentionExpiresAt: timestampSchema,
        createdAt: timestampSchema,
    })
    .strict();
