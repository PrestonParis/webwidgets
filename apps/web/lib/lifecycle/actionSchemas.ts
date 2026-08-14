import { z } from 'zod';
import { jsonValueSchema } from './coreSchemas';

const timestampSchema = z.string().datetime({ offset: true });
const metadataSchema = z.record(z.string(), jsonValueSchema);

export const actionRequestInputSchema = z.object({
    userId: z.string().uuid(),
    candidateActionId: z.string().uuid(),
    automationRunId: z.string().uuid().optional(),
    jobId: z.string().uuid().optional(),
    idempotencyKey: z.string().min(1).max(700),
    actionId: z.string().min(1).max(240),
    sourceWidgetId: z.string().optional(),
    payload: jsonValueSchema.default({}),
    payloadHash: z.string().min(16).max(200).optional(),
    payloadVersion: z.number().int().min(1).default(1),
    policyVersion: z.string().min(1).max(200),
    permissionSnapshotHash: z.string().min(16).max(200),
    confidence: z.number().min(0).max(1).optional(),
    expiresAt: timestampSchema.optional(),
});

export const approvalDecisionInputSchema = z
    .object({
        userId: z.string().uuid(),
        actionRequestId: z.string().uuid(),
        decision: z.enum(['approved', 'denied']),
        payload: jsonValueSchema.optional(),
        payloadHash: z.string().min(16).max(200).optional(),
        payloadVersion: z.number().int().min(1).optional(),
        permissionSnapshotHash: z.string().min(16).max(200),
        decidedAt: timestampSchema.optional(),
    })
    .superRefine((value, context) => {
        if (value.decision === 'approved') {
            for (const field of [
                'payload',
                'payloadHash',
                'payloadVersion',
            ] as const) {
                if (value[field] === undefined) {
                    context.addIssue({
                        code: 'custom',
                        path: [field],
                        message: `${field} is required for approval`,
                    });
                }
            }
        }
    });

export const actionResultInputSchema = z
    .object({
        userId: z.string().uuid(),
        actionRequestId: z.string().uuid(),
        jobId: z.string().uuid().optional(),
        idempotencyKey: z.string().min(1).max(700),
        attempt: z.number().int().min(1).default(1),
        status: z.enum([
            'started',
            'succeeded',
            'failed',
            'cancelled',
            'unknown',
        ]),
        providerId: z.string().min(1).max(200).optional(),
        providerExecutionId: z.string().min(1).max(500).optional(),
        output: jsonValueSchema.optional(),
        resultHash: z.string().min(16).max(200).optional(),
        message: z.string().max(2000),
        failureCode: z.string().max(200).optional(),
        failureDetail: z.string().max(4000).optional(),
        verificationStatus: z
            .enum(['pending', 'verified', 'mismatched', 'unverifiable'])
            .optional(),
        verifiedAt: timestampSchema.optional(),
        undoStatus: z
            .enum([
                'not_available',
                'available',
                'requested',
                'completed',
                'failed',
            ])
            .optional(),
        rollbackToken: z.string().max(1000).optional(),
        compensationMetadata: metadataSchema.default({}),
        metadata: metadataSchema.default({}),
        startedAt: timestampSchema.optional(),
        completedAt: timestampSchema.optional(),
        expiresAt: timestampSchema.optional(),
    })
    .refine(
        (value) =>
            value.verificationStatus !== 'verified' ||
            Boolean(value.verifiedAt),
        {
            path: ['verifiedAt'],
            message: 'Verified outcomes require verifiedAt',
        },
    );

export const lifecycleTraceQuerySchema = z.object({
    userId: z.string().uuid(),
    actionRequestId: z.string().uuid(),
});
