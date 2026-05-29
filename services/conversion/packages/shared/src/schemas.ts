import { z } from 'zod';

export const conversionKindSchema = z.enum(['document', 'image']);

export const conversionJobStatusSchema = z.enum([
    'queued',
    'processing',
    'completed',
    'failed',
    'cancelled',
]);

export const supportedExtensionSchema = z.enum([
    'doc',
    'docx',
    'rtf',
    'pptx',
    'ppt',
    'xlsx',
    'xls',
    'ods',
    'odp',
    'odt',
    'html',
    'htm',
    'md',
    'markdown',
    'txt',
    'pdf',
    'csv',
    'epub',
    'png',
    'jpg',
    'jpeg',
    'webp',
    'gif',
    'tiff',
    'bmp',
    'svg',
]);

export const createConversionJobRequestSchema = z
    .object({
        originalFileName: z.string().min(1).max(255),
        sourceMime: z.string().min(1).max(255),
        sourceExtension: supportedExtensionSchema,
        targetExtension: supportedExtensionSchema,
        fileSizeBytes: z.number().int().nonnegative(),
        userId: z.string().min(1).max(255).optional(),
    })
    .transform((data) => ({
        ...data,
        sourceExtension: normalizeExtension(
            data.sourceExtension,
        ) as typeof data.sourceExtension,
        targetExtension: normalizeExtension(
            data.targetExtension,
        ) as typeof data.targetExtension,
    }));

export const createConversionJobResponseSchema = z.object({
    jobId: z.string().uuid(),
    inputObjectKey: z.string().min(1),
    uploadUrl: z.string().url().optional(),
    uploadMethod: z.enum(['PUT', 'POST']).default('PUT'),
    statusUrl: z.string().min(1),
});

export const conversionJobSchema = z.object({
    id: z.string().uuid(),
    status: conversionJobStatusSchema,
    kind: conversionKindSchema,
    originalFileName: z.string(),
    sourceMime: z.string(),
    sourceExtension: supportedExtensionSchema,
    targetExtension: supportedExtensionSchema,
    fileSizeBytes: z.number().int().nonnegative(),
    userId: z.string().optional(),
    inputObjectKey: z.string(),
    outputObjectKey: z.string().optional(),
    errorMessage: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const supportedConversionSchema = z.object({
    kind: conversionKindSchema,
    sourceExtension: supportedExtensionSchema,
    targetExtension: supportedExtensionSchema,
    label: z.string(),
    worker: z.enum(['worker-docs', 'worker-images']),
    workerFamily: z.enum(['documents', 'images']).optional(),
    engine: z
        .enum(['libreoffice', 'pandoc', 'native', 'pdftotext', 'pdftohtml'])
        .optional(),
    lossy: z.boolean().optional(),
    notes: z.string().optional(),
    warnings: z.array(z.string()).optional(),
});

export function normalizeExtension(extension: string) {
    const ext = extension.toLowerCase();
    if (ext === 'jpeg') return 'jpg';
    if (ext === 'htm') return 'html';
    if (ext === 'markdown') return 'md';
    return ext;
}
