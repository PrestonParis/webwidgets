import type { z } from 'zod';
import type {
    batchStatusSchema,
    conversionBatchSchema,
    conversionJobSchema,
    conversionJobStatusSchema,
    conversionKindSchema,
    createBatchJobRequestSchema,
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
export type BatchStatus = z.infer<typeof batchStatusSchema>;
export type ConversionBatch = z.infer<typeof conversionBatchSchema>;
export type CreateBatchJobRequest = z.infer<typeof createBatchJobRequestSchema>;
