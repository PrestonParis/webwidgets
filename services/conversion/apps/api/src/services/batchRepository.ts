import { eq, inArray } from 'drizzle-orm';
import type {
    ConversionBatch,
    ConversionJob,
    CreateConversionJobRequest,
} from '@webwidgets/conversion-shared';
import { findSupportedConversion } from '@webwidgets/conversion-shared';
import { db } from '../db/client.js';
import {
    conversionBatches,
    conversionJobs,
    type ConversionBatchRow,
    type ConversionJobRow,
} from '../db/schema.js';
import { buildInputObjectKey } from './storage.js';

function toBatch(row: ConversionBatchRow): ConversionBatch {
    const completed = row.completedJobs;
    const failed = row.failedJobs;
    const total = row.totalJobs;

    let status: ConversionBatch['status'] =
        row.status as ConversionBatch['status'];
    if (row.status === 'pending' || row.status === 'processing') {
        if (completed + failed === total && total > 0) {
            status =
                failed === total
                    ? 'failed'
                    : failed > 0
                      ? 'partial'
                      : 'completed';
        } else if (completed + failed > 0) {
            status = 'processing';
        }
    }

    return {
        id: row.id,
        status,
        totalJobs: total,
        completedJobs: completed,
        failedJobs: failed,
        ...(row.userId ? { userId: row.userId } : {}),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

function toJob(row: ConversionJobRow): ConversionJob {
    return {
        id: row.id,
        status: row.status as ConversionJob['status'],
        kind: row.kind as ConversionJob['kind'],
        originalFileName: row.originalFileName,
        sourceMime: row.sourceMime,
        sourceExtension:
            row.sourceExtension as ConversionJob['sourceExtension'],
        targetExtension:
            row.targetExtension as ConversionJob['targetExtension'],
        fileSizeBytes: row.fileSizeBytes,
        ...(row.userId ? { userId: row.userId } : {}),
        inputObjectKey: row.inputObjectKey,
        ...(row.outputObjectKey
            ? { outputObjectKey: row.outputObjectKey }
            : {}),
        ...(row.errorMessage ? { errorMessage: row.errorMessage } : {}),
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
    };
}

export interface CreateBatchResult {
    batch: ConversionBatch;
    jobs: Array<{ job: ConversionJob; uploadUrl: string }>;
}

export async function createBatch(
    requests: CreateConversionJobRequest[],
    createUploadUrl: (key: string) => Promise<string>,
    userId?: string,
): Promise<CreateBatchResult> {
    const batchId = crypto.randomUUID();

    const [batchRow] = await db
        .insert(conversionBatches)
        .values({
            id: batchId,
            status: 'pending',
            totalJobs: requests.length,
            completedJobs: 0,
            failedJobs: 0,
            ...(userId ? { userId } : {}),
        })
        .returning();

    if (!batchRow) throw new Error('Failed to create conversion batch.');

    const jobEntries: Array<{
        jobId: string;
        inputObjectKey: string;
        uploadUrl: string;
    }> = [];

    for (const req of requests) {
        const jobId = crypto.randomUUID();
        const inputObjectKey = buildInputObjectKey(jobId, req.originalFileName);
        const uploadUrl = await createUploadUrl(inputObjectKey);
        jobEntries.push({ jobId, inputObjectKey, uploadUrl });

        await db.insert(conversionJobs).values({
            id: jobId,
            batchId,
            status: 'pending',
            kind:
                findSupportedConversion(
                    req.sourceExtension,
                    req.targetExtension,
                )?.kind ?? 'document',
            originalFileName: req.originalFileName,
            sourceMime: req.sourceMime,
            sourceExtension: req.sourceExtension,
            targetExtension: req.targetExtension,
            fileSizeBytes: req.fileSizeBytes,
            ...(req.userId ? { userId: req.userId } : {}),
            inputObjectKey,
        });
    }

    const jobRows = await db
        .select()
        .from(conversionJobs)
        .where(eq(conversionJobs.batchId, batchId));

    const jobs = jobRows.map((row) => {
        const entry = jobEntries.find((e) => e.jobId === row.id);
        return { job: toJob(row), uploadUrl: entry?.uploadUrl ?? '' };
    });

    return { batch: toBatch(batchRow), jobs };
}

export async function getBatch(batchId: string): Promise<{
    batch: ConversionBatch;
    jobs: ConversionJob[];
} | null> {
    const [batchRow] = await db
        .select()
        .from(conversionBatches)
        .where(eq(conversionBatches.id, batchId))
        .limit(1);

    if (!batchRow) return null;

    const jobRows = await db
        .select()
        .from(conversionJobs)
        .where(eq(conversionJobs.batchId, batchId));

    // Recompute derived counters from live job rows.
    const completed = jobRows.filter((r) => r.status === 'completed').length;
    const failed = jobRows.filter((r) => r.status === 'failed').length;
    const fresh = { ...batchRow, completedJobs: completed, failedJobs: failed };

    return { batch: toBatch(fresh), jobs: jobRows.map(toJob) };
}

export async function markBatchJobsQueued(
    batchId: string,
): Promise<ConversionJob[]> {
    const rows = await db
        .update(conversionJobs)
        .set({ status: 'queued', updatedAt: new Date() })
        .where(
            inArray(
                conversionJobs.id,
                db
                    .select({ id: conversionJobs.id })
                    .from(conversionJobs)
                    .where(eq(conversionJobs.batchId, batchId)),
            ),
        )
        .returning();

    await db
        .update(conversionBatches)
        .set({ status: 'processing', updatedAt: new Date() })
        .where(eq(conversionBatches.id, batchId));

    return rows.map(toJob);
}
