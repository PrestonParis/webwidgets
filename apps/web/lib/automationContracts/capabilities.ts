import { z } from 'zod';
import { automationErrorSchema } from './errors';
import {
    contentHashSchema,
    contractVersionSchema,
    identifierSchema,
    jsonObjectSchema,
    timestampSchema,
} from './primitives';

const capabilityIdentitySchema = z
    .object({
        name: identifierSchema,
        version: z.string().min(1).max(200),
    })
    .strict();

const capabilityRequestBaseSchema = z
    .object({
        contractVersion: contractVersionSchema,
        requestId: z.string().uuid(),
        objectiveId: z.string().uuid(),
        runId: z.string().uuid(),
        attemptId: z.string().uuid(),
        userId: z.string().uuid(),
        capability: capabilityIdentitySchema,
        input: jsonObjectSchema,
        inputHash: contentHashSchema,
        idempotencyKey: z.string().min(1).max(500),
        policyDecisionId: z.string().uuid(),
        approvalId: z.string().uuid().optional(),
        budgetId: z.string().uuid(),
        ownershipEpoch: z.number().int().min(1),
        deadlineAt: timestampSchema,
    })
    .strict();

export function createCapabilityRequestSchema(
    knownCapabilityNames: ReadonlySet<string>,
) {
    return capabilityRequestBaseSchema.superRefine((value, context) => {
        if (!knownCapabilityNames.has(value.capability.name)) {
            context.addIssue({
                code: 'custom',
                path: ['capability', 'name'],
                message: `Unknown capability: ${value.capability.name}`,
            });
        }
    });
}

export const capabilitySuccessSchema = z
    .object({
        contractVersion: contractVersionSchema,
        requestId: z.string().uuid(),
        attemptId: z.string().uuid(),
        status: z.literal('succeeded'),
        output: jsonObjectSchema,
        outputHash: contentHashSchema,
        providerId: identifierSchema.optional(),
        providerExecutionId: z.string().min(1).max(500).optional(),
        completedAt: timestampSchema,
    })
    .strict();

export const capabilityFailureSchema = z
    .object({
        contractVersion: contractVersionSchema,
        requestId: z.string().uuid(),
        attemptId: z.string().uuid(),
        status: z.enum(['failed', 'cancelled', 'unknown']),
        error: automationErrorSchema,
        providerId: identifierSchema.optional(),
        providerExecutionId: z.string().min(1).max(500).optional(),
        completedAt: timestampSchema,
    })
    .strict();

export const capabilityResultSchema = z.discriminatedUnion('status', [
    capabilitySuccessSchema,
    capabilityFailureSchema,
]);

export const verificationRequestSchema = z
    .object({
        contractVersion: contractVersionSchema,
        requestId: z.string().uuid(),
        objectiveId: z.string().uuid(),
        runId: z.string().uuid(),
        effectId: z.string().uuid(),
        userId: z.string().uuid(),
        verifierName: identifierSchema,
        verifierVersion: z.string().min(1).max(200),
        expectedPostconditions: z.array(jsonObjectSchema).min(1),
        deadlineAt: timestampSchema,
    })
    .strict();

export const verificationResultSchema = z
    .object({
        contractVersion: contractVersionSchema,
        requestId: z.string().uuid(),
        effectId: z.string().uuid(),
        status: z.enum(['verified', 'mismatched', 'unverifiable', 'unknown']),
        observedState: jsonObjectSchema,
        observedStateHash: contentHashSchema,
        reasonCodes: z.array(identifierSchema),
        verifiedAt: timestampSchema,
    })
    .strict();

export const compensationRequestSchema = z
    .object({
        contractVersion: contractVersionSchema,
        requestId: z.string().uuid(),
        objectiveId: z.string().uuid(),
        runId: z.string().uuid(),
        effectId: z.string().uuid(),
        userId: z.string().uuid(),
        capability: capabilityIdentitySchema,
        originalProviderExecutionId: z.string().min(1).max(500),
        reasonCode: identifierSchema,
        idempotencyKey: z.string().min(1).max(500),
        policyDecisionId: z.string().uuid(),
        approvalId: z.string().uuid().optional(),
        deadlineAt: timestampSchema,
    })
    .strict();

export type CapabilityRequest = z.infer<typeof capabilityRequestBaseSchema>;
export type CapabilityResult = z.infer<typeof capabilityResultSchema>;
