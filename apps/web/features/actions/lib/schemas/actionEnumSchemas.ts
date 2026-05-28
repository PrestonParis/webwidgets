import { z } from 'zod';

export const actionCategorySchema = z.enum([
    'email',
    'calendar',
    'tasks',
    'tracking',
    'finance',
    'knowledge',
    'automation',
    'news',
    'system',
]);

export const providerScopeSchema = z.enum([
    'local',
    'email',
    'calendar',
    'news',
    'finance',
    'automation',
    'internal',
]);

export const destructiveLevelSchema = z.enum(['safe', 'warning', 'critical']);
export const queueabilitySchema = z.enum(['immediate', 'optional', 'required']);
export const mutabilitySchema = z.enum(['read-only', 'state-altering']);
export const approvalStateSchema = z.enum([
    'not_required',
    'required',
    'approved',
    'denied',
]);

export type ActionCategory = z.infer<typeof actionCategorySchema>;
export type ProviderScope = z.infer<typeof providerScopeSchema>;
export type DestructiveLevel = z.infer<typeof destructiveLevelSchema>;
export type Queueability = z.infer<typeof queueabilitySchema>;
export type Mutability = z.infer<typeof mutabilitySchema>;
export type ApprovalState = z.infer<typeof approvalStateSchema>;
