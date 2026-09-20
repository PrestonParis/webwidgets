import { z } from 'zod';
import {
    contentHashSchema,
    contractVersionSchema,
    identifierSchema,
    jsonObjectSchema,
    nullableTimestampSchema,
    riskClassSchema,
    serializeJson,
    timestampSchema,
} from './primitives';

export const policyDecisionSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        objectiveId: z.string().uuid(),
        planId: z.string().uuid().nullable(),
        stepId: z.string().uuid().nullable(),
        budgetId: z.string().uuid(),
        userId: z.string().uuid(),
        capabilityName: identifierSchema.nullable(),
        capabilityVersion: z.string().min(1).max(200).nullable(),
        riskClass: riskClassSchema,
        normalizedPayload: jsonObjectSchema,
        payloadHash: contentHashSchema,
        policyVersion: z.string().min(1).max(200),
        consentSnapshotHash: contentHashSchema,
        connectionSnapshotHash: contentHashSchema,
        budgetSnapshotHash: contentHashSchema,
        delegationSnapshotHash: contentHashSchema,
        allowlistSnapshotHash: contentHashSchema,
        decision: z.enum(['allow', 'deny', 'require_approval']),
        reasonCodes: z.array(identifierSchema),
        requiresApproval: z.boolean(),
        evaluatedAt: timestampSchema,
        expiresAt: timestampSchema,
    })
    .strict()
    .superRefine((value, context) => {
        if (
            value.requiresApproval !==
            (value.decision === 'require_approval')
        ) {
            context.addIssue({
                code: 'custom',
                path: ['requiresApproval'],
                message: 'Approval requirement must match the policy decision',
            });
        }
        if (value.stepId !== null && value.planId === null) {
            context.addIssue({
                code: 'custom',
                path: ['stepId'],
                message: 'Plan and step references must be supplied together',
            });
        }
    });

export const approvalSchema = z
    .object({
        contractVersion: contractVersionSchema,
        id: z.string().uuid(),
        objectiveId: z.string().uuid(),
        planId: z.string().uuid(),
        stepId: z.string().uuid(),
        policyDecisionId: z.string().uuid(),
        userId: z.string().uuid(),
        payload: jsonObjectSchema,
        payloadHash: contentHashSchema,
        payloadVersion: z.number().int().min(1),
        status: z.enum(['pending', 'approved', 'denied', 'expired', 'revoked']),
        decidedBy: z.string().uuid().nullable(),
        decidedPayload: jsonObjectSchema.nullable(),
        decidedPayloadHash: contentHashSchema.nullable(),
        decidedPayloadVersion: z.number().int().min(1).nullable(),
        requestedAt: timestampSchema,
        decidedAt: nullableTimestampSchema,
        expiresAt: timestampSchema,
    })
    .strict()
    .superRefine((value, context) => {
        if (value.decidedBy !== null && value.decidedBy !== value.userId) {
            context.addIssue({
                code: 'custom',
                path: ['decidedBy'],
                message: 'Approval actor must match the owning user',
            });
        }
        if (value.status === 'approved') {
            const exact =
                value.decidedPayloadHash === value.payloadHash &&
                value.decidedPayloadVersion === value.payloadVersion &&
                value.decidedPayload !== null &&
                serializeJson(value.decidedPayload) ===
                    serializeJson(value.payload);
            if (!exact) {
                context.addIssue({
                    code: 'custom',
                    path: ['decidedPayload'],
                    message:
                        'Approval must cover the exact payload and version',
                });
            }
        }
    });

export const approvalDecisionRequestSchema = z
    .object({
        contractVersion: contractVersionSchema,
        approvalId: z.string().uuid(),
        expectedPayloadHash: contentHashSchema,
        expectedPayloadVersion: z.number().int().min(1),
        decision: z.enum(['approved', 'denied']),
        decidedPayload: jsonObjectSchema.optional(),
        decidedAt: timestampSchema,
    })
    .strict()
    .superRefine((value, context) => {
        if (
            value.decision === 'approved' &&
            value.decidedPayload === undefined
        ) {
            context.addIssue({
                code: 'custom',
                path: ['decidedPayload'],
                message: 'Approved decisions require the exact decided payload',
            });
        }
    });
