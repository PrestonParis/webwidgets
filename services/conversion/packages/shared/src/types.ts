import type { z } from 'zod';
import type {
    conversionJobSchema,
    conversionJobStatusSchema,
    conversionKindSchema,
    createConversionJobRequestSchema,
    createConversionJobResponseSchema,
    supportedConversionSchema,
} from './schemas.js';

export type ConversionKind = z.infer<typeof conversionKindSchema>;
export type ConversionJobStatus = z.infer<typeof conversionJobStatusSchema>;
export type CreateConversionJobRequest = z.infer<
    typeof createConversionJobRequestSchema
>;
export type CreateConversionJobResponse = z.infer<
    typeof createConversionJobResponseSchema
>;
export type ConversionJob = z.infer<typeof conversionJobSchema>;
export type SupportedConversion = z.infer<typeof supportedConversionSchema>;
