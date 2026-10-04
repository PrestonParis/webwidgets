import { z } from 'zod';
import {
    contractVersionSchema,
    jsonObjectSchema,
    jsonValueSchema,
    nullableTimestampSchema,
    riskClassSchema,
} from '@/lib/automationContracts/primitives';

const id = z.string().uuid();
const maturityLevelSchema = z.number().int().min(1).max(4);

export const planGraphSnapshotSchema = z
    .object({
        contractVersion: contractVersionSchema,
        plan: z
            .object({
                id,
                objectiveId: id,
                objectiveVersionId: id,
                userId: id,
                version: z.number().int().min(1),
                maturityLevel: maturityLevelSchema,
                status: z.enum([
                    'draft',
                    'published',
                    'superseded',
                    'invalidated',
                ]),
                plannerVersion: z.string().min(1).max(200),
                capabilityRegistryVersion: z.string().min(1).max(200),
                contextPackageId: id.nullable(),
                policySnapshotId: id.nullable(),
                budgetSnapshot: jsonObjectSchema,
                graphHash: z.string().min(16).max(200),
                previousPlanId: id.nullable(),
                revisionReason: z.string().max(2000).nullable(),
                publishedAt: nullableTimestampSchema,
                supersededAt: nullableTimestampSchema,
            })
            .strict(),
        steps: z.array(
            z
                .object({
                    id,
                    planId: id,
                    objectiveId: id,
                    userId: id,
                    stepKey: z.string().min(1).max(200),
                    position: z.number().int().min(0),
                    capabilityName: z.string().min(1).max(240),
                    capabilityVersion: z.string().min(1).max(200),
                    riskClass: riskClassSchema,
                    input: jsonObjectSchema,
                    inputHash: z.string().min(16).max(200),
                    expectedPostconditions: z.array(jsonValueSchema),
                    retryPolicy: jsonObjectSchema,
                    timeoutSeconds: z.number().int().min(1).max(86_400),
                    idempotencyScope: z.string().min(1).max(300),
                })
                .strict(),
        ),
        dependencies: z.array(
            z
                .object({
                    planId: id,
                    objectiveId: id,
                    userId: id,
                    stepId: id,
                    dependsOnStepId: id,
                    condition: jsonObjectSchema,
                })
                .strict(),
        ),
        activeCapabilityKeys: z.array(z.string()),
    })
    .strict();

export type PlanGraphSnapshot = z.infer<typeof planGraphSnapshotSchema>;
