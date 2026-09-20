import { z } from 'zod';
import {
    contractVersionSchema,
    jsonObjectSchema,
} from '@/lib/automationContracts/primitives';

const capabilityKeySchema = z
    .string()
    .min(3)
    .max(450)
    .regex(/^[a-z0-9][a-z0-9_.-]+@[1-9][0-9]*$/u);

const safeCounterSchema = z.number().int().min(0).max(Number.MAX_SAFE_INTEGER);

const resourceBudgetSchema = z
    .object({
        id: z.string().uuid(),
        status: z.enum(['active', 'exhausted', 'closed']),
        maxAttempts: safeCounterSchema.min(1),
        maxProviderCalls: safeCounterSchema,
        maxModelTokens: safeCounterSchema,
        maxCostMicrounits: safeCounterSchema,
        maxActiveSeconds: safeCounterSchema.min(1),
        attemptsUsed: safeCounterSchema,
        providerCallsUsed: safeCounterSchema,
        modelTokensUsed: safeCounterSchema,
        costMicrounitsUsed: safeCounterSchema,
        activeSecondsUsed: safeCounterSchema,
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
        provider: z.enum(['google', 'microsoft']),
        accountId: z.string().uuid(),
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
    })
    .strict();

export type AutomationPolicyRequest = z.infer<
    typeof automationPolicyRequestSchema
>;
