import { z } from 'zod';
import {
    contractVersionSchema,
    jsonObjectSchema,
    timestampSchema,
} from '@/lib/automationContracts/primitives';

const capabilityKeySchema = z
    .string()
    .min(3)
    .max(450)
    .regex(/^[a-z0-9][a-z0-9_.-]+@[1-9][0-9]*$/u);

const MAX_POLICY_DECISION_TTL_MS = 5 * 60 * 1000;

const resourceBudgetSchema = z
    .object({
        id: z.string().uuid(),
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
    })
    .strict();

const consentSnapshotSchema = z
    .object({
        state: z.enum(['active', 'revoked', 'stale']),
        capabilityKeys: z.array(capabilityKeySchema),
    })
    .strict();

const connectionGrantSchema = z
    .object({
        integration: z.enum([
            'google_calendar',
            'google_mail',
            'microsoft_mail',
        ]),
        scopes: z.array(z.string().min(1).max(240)),
    })
    .strict();

const connectionSnapshotSchema = z
    .object({
        state: z.enum(['current', 'stale']),
        grants: z.array(connectionGrantSchema),
    })
    .strict();

const delegationSnapshotSchema = z
    .object({
        state: z.enum(['current', 'stale', 'disabled']),
        capabilityKeys: z.array(capabilityKeySchema),
    })
    .strict();

export const automationPolicyRequestSchema = z
    .object({
        contractVersion: contractVersionSchema,
        decisionId: z.string().uuid(),
        objectiveId: z.string().uuid(),
        planId: z.string().uuid(),
        stepId: z.string().uuid(),
        userId: z.string().uuid(),
        objectiveStatus: z.enum([
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
        capabilityName: z.string().min(1).max(240),
        capabilityVersion: z.string().min(1).max(200),
        payload: jsonObjectSchema,
        permittedCapabilityKeys: z.array(capabilityKeySchema),
        consent: consentSnapshotSchema,
        connections: connectionSnapshotSchema,
        delegation: delegationSnapshotSchema,
        budget: resourceBudgetSchema,
        evaluatedAt: timestampSchema,
        expiresAt: timestampSchema,
    })
    .strict()
    .refine(
        ({ evaluatedAt, expiresAt }) =>
            Date.parse(expiresAt) > Date.parse(evaluatedAt),
        {
            message: 'Policy decision expiry must follow evaluation time',
            path: ['expiresAt'],
        },
    )
    .refine(
        ({ evaluatedAt, expiresAt }) =>
            Date.parse(expiresAt) - Date.parse(evaluatedAt) <=
            MAX_POLICY_DECISION_TTL_MS,
        {
            message:
                'Policy decisions may remain current for at most 5 minutes',
            path: ['expiresAt'],
        },
    );

export type AutomationPolicyRequest = z.infer<
    typeof automationPolicyRequestSchema
>;
