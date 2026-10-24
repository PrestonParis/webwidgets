import { z } from 'zod';
import {
    contentHashSchema,
    contractVersionSchema,
    jsonObjectSchema,
    jsonValueSchema,
    nullableTimestampSchema,
    riskClassSchema,
    timestampSchema,
} from './primitives';

const maturityLevelSchema = z.number().int().min(1).max(4);
const stateVersionSchema = z.number().int().min(1);

export const objectiveSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        userId: z.string().uuid(),
        workspaceId: z.string().uuid().nullable(),
        clientRequestKey: z.string().min(1).max(300),
        title: z.string().min(1).max(500),
        maturityLevel: maturityLevelSchema,
        status: z.enum([
            'draft',
            'submitted',
            'active',
            'paused',
            'blocked',
            'cancel_requested',
            'cancelled',
            'completed',
            'failed',
            'archived',
        ]),
        stateVersion: stateVersionSchema,
        deadlineAt: nullableTimestampSchema,
        submittedAt: nullableTimestampSchema,
        completedAt: nullableTimestampSchema,
        cancellationRequestedAt: nullableTimestampSchema,
        cancellationReason: z.string().max(2000).nullable(),
        archivedAt: nullableTimestampSchema,
        retentionExpiresAt: timestampSchema,
        createdAt: timestampSchema,
        updatedAt: timestampSchema,
    })
    .strict();

export const objectiveVersionSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        objectiveId: z.string().uuid(),
        userId: z.string().uuid(),
        version: z.number().int().min(1),
        intent: z.string().min(1).max(8000),
        scope: jsonObjectSchema,
        expectedOutputs: z.array(jsonValueSchema),
        successConditions: z.array(jsonValueSchema),
        failureConditions: z.array(jsonValueSchema),
        stopConditions: z.array(jsonValueSchema),
        permittedCapabilities: z.array(z.string().min(1).max(240)),
        permittedSourceClasses: z.array(z.string().min(1).max(120)),
        policyVersion: z.string().min(1).max(200),
        contentHash: contentHashSchema,
        publishedAt: nullableTimestampSchema,
        supersededAt: nullableTimestampSchema,
    })
    .strict();

export const objectivePlanSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        objectiveId: z.string().uuid(),
        objectiveVersionId: z.string().uuid(),
        userId: z.string().uuid(),
        version: z.number().int().min(1),
        maturityLevel: maturityLevelSchema,
        status: z.enum(['draft', 'published', 'superseded', 'invalidated']),
        plannerVersion: z.string().min(1).max(200),
        capabilityRegistryVersion: z.string().min(1).max(200),
        contextPackageId: z.string().uuid().nullable(),
        policySnapshotId: z.string().uuid().nullable(),
        budgetSnapshot: jsonObjectSchema,
        graphHash: contentHashSchema,
        previousPlanId: z.string().uuid().nullable(),
        revisionReason: z.string().max(2000).nullable(),
        publishedAt: nullableTimestampSchema,
        supersededAt: nullableTimestampSchema,
    })
    .strict();

export const objectivePlanStepSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        planId: z.string().uuid(),
        objectiveId: z.string().uuid(),
        userId: z.string().uuid(),
        stepKey: z.string().min(1).max(200),
        position: z.number().int().min(0),
        capabilityName: z.string().min(1).max(240),
        capabilityVersion: z.string().min(1).max(200),
        riskClass: riskClassSchema,
        input: jsonObjectSchema,
        inputHash: contentHashSchema,
        expectedPostconditions: z.array(jsonValueSchema),
        retryPolicy: jsonObjectSchema,
        timeoutSeconds: z.number().int().min(1).max(86_400),
        idempotencyScope: z.string().min(1).max(300),
    })
    .strict();

export function createObjectivePlanStepSchema(
    knownCapabilityNames: ReadonlySet<string>,
) {
    return objectivePlanStepSchema.refine(
        (value) => knownCapabilityNames.has(value.capabilityName),
        {
            message: 'Plan step references an unknown capability',
            path: ['capabilityName'],
        },
    );
}

export const objectiveStepDependencySchema = z
    .object({
        contractVersion: contractVersionSchema,
        planId: z.string().uuid(),
        objectiveId: z.string().uuid(),
        userId: z.string().uuid(),
        stepId: z.string().uuid(),
        dependsOnStepId: z.string().uuid(),
        condition: jsonObjectSchema,
    })
    .strict()
    .refine((value) => value.stepId !== value.dependsOnStepId, {
        message: 'A step cannot depend on itself',
        path: ['dependsOnStepId'],
    });

export const objectiveBudgetSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        objectiveId: z.string().uuid(),
        objectiveVersionId: z.string().uuid(),
        userId: z.string().uuid(),
        version: z.number().int().min(1),
        status: z.enum(['active', 'exhausted', 'closed']),
        maxAttempts: z.number().int().min(1),
        maxProviderCalls: z.number().int().min(0),
        maxModelTokens: z.number().int().min(0),
        maxCostMicrounits: z.number().int().min(0),
        maxActiveSeconds: z.number().int().min(1),
        attemptsUsed: z.number().int().min(0),
        providerCallsUsed: z.number().int().min(0),
        modelTokensUsed: z.number().int().min(0),
        costMicrounitsUsed: z.number().int().min(0),
        activeSecondsUsed: z.number().int().min(0),
        additionalLimits: jsonObjectSchema,
        exhaustedAt: nullableTimestampSchema,
    })
    .strict()
    .superRefine((value, context) => {
        const usage = [
            ['attemptsUsed', value.attemptsUsed, value.maxAttempts],
            [
                'providerCallsUsed',
                value.providerCallsUsed,
                value.maxProviderCalls,
            ],
            ['modelTokensUsed', value.modelTokensUsed, value.maxModelTokens],
            [
                'costMicrounitsUsed',
                value.costMicrounitsUsed,
                value.maxCostMicrounits,
            ],
            [
                'activeSecondsUsed',
                value.activeSecondsUsed,
                value.maxActiveSeconds,
            ],
        ] as const;
        for (const [field, used, maximum] of usage) {
            if (used > maximum) {
                context.addIssue({
                    code: 'custom',
                    path: [field],
                    message: `${field} exceeds its budget`,
                });
            }
        }
    });

export const createObjectiveRequestSchema = z
    .object({
        contractVersion: contractVersionSchema,
        workspaceId: z.string().uuid().optional(),
        clientRequestKey: z.string().min(1).max(300),
        title: z.string().min(1).max(500),
        maturityLevel: maturityLevelSchema,
        deadlineAt: timestampSchema.optional(),
        intent: z.string().min(1).max(8000),
        scope: jsonObjectSchema.default({}),
        expectedOutputs: z.array(jsonValueSchema).default([]),
        successConditions: z.array(jsonValueSchema).min(1),
        failureConditions: z.array(jsonValueSchema).default([]),
        stopConditions: z.array(jsonValueSchema).min(1),
    })
    .strict();

export const cancelObjectiveRequestSchema = z
    .object({
        contractVersion: contractVersionSchema,
        objectiveId: z.string().uuid(),
        expectedStateVersion: stateVersionSchema,
        reason: z.string().min(1).max(2000),
        requestedAt: timestampSchema,
    })
    .strict();

export function createPublishPlanRequestSchema(
    knownCapabilityNames: ReadonlySet<string>,
) {
    return z
        .object({
            contractVersion: contractVersionSchema,
            plan: objectivePlanSchema,
            steps: z.array(createObjectivePlanStepSchema(knownCapabilityNames)),
            dependencies: z.array(objectiveStepDependencySchema),
        })
        .strict();
}
