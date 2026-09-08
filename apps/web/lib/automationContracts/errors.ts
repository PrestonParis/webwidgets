import { z } from 'zod';
import { jsonObjectSchema } from './primitives';

export const automationErrorCategorySchema = z.enum([
    'invalid_contract',
    'unsupported_version',
    'unknown_capability',
    'authentication_required',
    'authorization_denied',
    'approval_required',
    'approval_stale',
    'budget_exhausted',
    'dependency_blocked',
    'provider_unavailable',
    'provider_rejected',
    'timeout',
    'conflict',
    'cancelled',
    'verification_failed',
    'outcome_unknown',
    'internal',
]);

export const automationErrorSchema = z
    .object({
        category: automationErrorCategorySchema,
        code: z.string().regex(/^[a-z0-9][a-z0-9_.-]{0,199}$/),
        retryable: z.boolean(),
        safeMessage: z.string().min(1).max(500),
        details: jsonObjectSchema.default({}),
    })
    .strict();

export type AutomationError = z.infer<typeof automationErrorSchema>;

export function safeProviderError(
    category: Extract<
        AutomationError['category'],
        'provider_unavailable' | 'provider_rejected' | 'timeout'
    >,
    code: string,
    retryable: boolean,
): AutomationError {
    return automationErrorSchema.parse({
        category,
        code,
        retryable,
        safeMessage: 'The provider operation did not complete.',
        details: {},
    });
}
