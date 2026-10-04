import { z } from 'zod';
import { jsonObjectSchema } from '@/lib/automationContracts/primitives';

export const policyEvaluationBodySchema = z
    .object({
        contractVersion: z.literal('2.0'),
        planId: z.string().uuid(),
        stepId: z.string().uuid(),
    })
    .strict();

export const persistenceResultSchema = z
    .object({
        decisionId: z.string().uuid(),
        approvalId: z.string().uuid().nullable(),
        reused: z.boolean(),
    })
    .strict();

const authorityBudgetSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(['active', 'exhausted', 'closed']),
    maxAttempts: z.number().int().safe(),
    maxProviderCalls: z.number().int().safe(),
    maxModelTokens: z.number().int().safe(),
    maxCostMicrounits: z.number().int().safe(),
    maxActiveSeconds: z.number().int().safe(),
    attemptsUsed: z.number().int().safe(),
    providerCallsUsed: z.number().int().safe(),
    modelTokensUsed: z.number().int().safe(),
    costMicrounitsUsed: z.number().int().safe(),
    activeSecondsUsed: z.number().int().safe(),
});

export const persistenceAuthoritySchema = z
    .object({
        objectiveVersionId: z.string().uuid(),
        stepInput: jsonObjectSchema,
        permittedCapabilityKeys: z.array(z.string()),
        consentRecords: z.array(
            z.object({ scope: z.string(), state: z.string() }),
        ),
        connectionAccounts: z.array(
            z.object({
                id: z.string().uuid(),
                provider: z.enum(['google', 'microsoft']),
                integrationConnectionId: z.string().uuid().nullable(),
            }),
        ),
        integrationConnections: z.array(
            z.object({
                id: z.string().uuid(),
                providerId: z.enum(['google', 'microsoft']),
                state: z.string(),
                scopes: z.array(z.string()),
            }),
        ),
        delegation: z.object({ state: z.literal('disabled') }).strict(),
        budget: authorityBudgetSchema,
    })
    .strict();

export type PersistenceAuthority = z.infer<typeof persistenceAuthoritySchema>;

export class PolicyPersistenceError extends Error {
    constructor(
        readonly code: string,
        readonly status: number,
    ) {
        super(code);
        this.name = 'PolicyPersistenceError';
    }
}
