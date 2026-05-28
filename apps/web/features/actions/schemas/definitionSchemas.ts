import { z, type ZodTypeAny } from 'zod';
import {
    actionCategorySchema,
    destructiveLevelSchema,
    mutabilitySchema,
    providerScopeSchema,
    queueabilitySchema,
} from '@/features/actions/schemas/actionEnumSchemas';

export interface ActionDefinition<Input = unknown, Output = unknown> {
    id: string;
    label: string;
    description: string;
    category: z.infer<typeof actionCategorySchema>;
    providerScope: z.infer<typeof providerScopeSchema>;
    mutability: z.infer<typeof mutabilitySchema>;
    destructiveLevel: z.infer<typeof destructiveLevelSchema>;
    queueability: z.infer<typeof queueabilitySchema>;
    expectedInputs: ZodTypeAny;
    expectedOutputs: ZodTypeAny;
    requiredPermissions: string[];
    requiredConsents: string[];
    canUndo: boolean;
    handlerId: string;
    examples?: Input[];
    outputExample?: Output;
}

export const actionDefinitionMetadataSchema = z.object({
    id: z.string(),
    label: z.string(),
    description: z.string(),
    category: actionCategorySchema,
    providerScope: providerScopeSchema,
    mutability: mutabilitySchema,
    destructiveLevel: destructiveLevelSchema,
    queueability: queueabilitySchema,
    requiredPermissions: z.array(z.string()),
    requiredConsents: z.array(z.string()),
    canUndo: z.boolean(),
    handlerId: z.string(),
});

export type ActionDefinitionMetadata = z.infer<
    typeof actionDefinitionMetadataSchema
>;
