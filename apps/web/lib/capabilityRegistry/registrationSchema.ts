import { z } from 'zod';
import { riskClassSchema } from '@/lib/automationContracts/primitives';

const bindingIdSchema = z
    .string()
    .min(1)
    .max(240)
    .regex(/^[a-z0-9][a-z0-9_.-]+$/u)
    .refine((value) => !/placeholder|echo|mock|noop/u.test(value));

export const capabilityRegistrationMetadataSchema = z
    .object({
        name: bindingIdSchema,
        version: z.string().regex(/^[1-9][0-9]*$/u),
        definitionHash: z.string().regex(/^[a-f0-9]{64}$/u),
        owner: z.enum(['typescript_worker', 'nextjs_provider_adapter']),
        requiredIntegrations: z.array(
            z.enum([
                'none',
                'google_calendar',
                'google_mail',
                'microsoft_mail',
            ]),
        ),
        requiredScopes: z.record(z.string(), z.array(z.string().min(1))),
        riskClass: riskClassSchema,
        reversibility: z.enum(['compensatable', 'manual', 'none']),
        idempotencyStrategy: z.literal('canonical_action_request'),
        executionPolicy: z
            .object({
                timeoutSeconds: z.number().int().min(1).max(300),
                maxAttempts: z.number().int().min(1).max(5),
                concurrencyKey: z.enum(['user', 'connection', 'objective']),
            })
            .strict(),
        binding: z
            .object({
                executorId: bindingIdSchema,
                verifierId: bindingIdSchema,
                compensationId: bindingIdSchema.optional(),
            })
            .strict(),
        observability: z
            .object({
                eventNamespace: z.literal('automation.capability'),
                recordInputHash: z.literal(true),
                recordOutputHash: z.literal(true),
                redactionPolicy: z.literal('registry_fields'),
            })
            .strict(),
        redactedInputFields: z.array(z.string().min(1).max(200)),
        fixture: z
            .object({
                id: bindingIdSchema,
                input: z.unknown(),
                output: z.unknown(),
                testReference: z.string().min(1).max(500),
            })
            .strict(),
    })
    .strict();
