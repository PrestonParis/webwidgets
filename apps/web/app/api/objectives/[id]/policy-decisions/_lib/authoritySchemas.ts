import { z } from 'zod';
import { jsonObjectSchema } from '@/lib/automationContracts/primitives';

export const objectiveRowSchema = z.object({
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
});
export const planRowSchema = z.object({
    objective_version_id: z.string().uuid(),
    status: z.string(),
});
export const stepRowSchema = z.object({
    capability_name: z.string(),
    capability_version: z.string(),
    input: jsonObjectSchema,
});
export const versionRowSchema = z.object({
    permitted_capabilities: z.array(z.string()),
    policy_version: z.string(),
});
export const budgetRowSchema = z.object({
    id: z.string().uuid(),
    status: z.enum(['active', 'exhausted', 'closed']),
    max_attempts: z.number(),
    max_provider_calls: z.number(),
    max_model_tokens: z.number(),
    max_cost_microunits: z.number(),
    max_active_seconds: z.number(),
    attempts_used: z.number(),
    provider_calls_used: z.number(),
    model_tokens_used: z.number(),
    cost_microunits_used: z.number(),
    active_seconds_used: z.number(),
});
export const consentRowSchema = z.object({
    scope: z.string(),
    state: z.string(),
});
export const accountRowSchema = z.object({
    id: z.string().uuid(),
    provider: z.enum(['google', 'microsoft']),
    integration_connection_id: z.string().uuid().nullable(),
});
export const connectionRowSchema = z.object({
    id: z.string().uuid(),
    provider_id: z.enum(['google', 'microsoft']),
    state: z.string(),
    scopes: z.array(z.string()),
});
