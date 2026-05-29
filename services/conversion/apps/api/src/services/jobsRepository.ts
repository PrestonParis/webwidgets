import { and, eq, inArray, lt } from 'drizzle-orm';
import type { ConversionJob, CreateConversionJobRequest } from '@webwidgets/conversion-shared';
import { findSupportedConversion } from '@webwidgets/conversion-shared';
import { db } from '../db/client.js';
import { conversionJobs, type ConversionJobRow } from '../db/schema.js';
import { buildInputObjectKey } from './storage.js';

function toJob(row: ConversionJobRow): ConversionJob {
  return {
    id: row.id,
    status: row.status as ConversionJob['status'],
    kind: row.kind as ConversionJob['kind'],
    originalFileName: row.originalFileName,
    sourceMime: row.sourceMime,
    sourceExtension: row.sourceExtension as ConversionJob['sourceExtension'],
    targetExtension: row.targetExtension as ConversionJob['targetExtension'],
    fileSizeBytes: row.fileSizeBytes,
    ...(row.userId ? { userId: row.userId } : {}),
    inputObjectKey: row.inputObjectKey,
    ...(row.outputObjectKey ? { outputObjectKey: row.outputObjectKey } : {}),
    ...(row.errorMessage ? { errorMessage: row.errorMessage } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export async function createJob(request: CreateConversionJobRequest) {
  const id = crypto.randomUUID();
  const inputObjectKey = buildInputObjectKey(id, request.originalFileName);
  const [row] = await db
    .insert(conversionJobs)
    .values({
      id,
      status: 'queued',
      kind: findSupportedConversion(request.sourceExtension, request.targetExtension)?.kind ?? 'document',
      originalFileName: request.originalFileName,
      sourceMime: request.sourceMime,
      sourceExtension: request.sourceExtension,
      targetExtension: request.targetExtension,
      fileSizeBytes: request.fileSizeBytes,
      userId: request.userId ?? null,
      inputObjectKey
    })
    .returning();

  if (!row) throw new Error('Failed to create conversion job.');
  return toJob(row);
}

export async function getJob(jobId: string) {
  const [row] = await db
    .select()
    .from(conversionJobs)
    .where(eq(conversionJobs.id, jobId))
    .limit(1);
  return row ? toJob(row) : null;
}

export async function markJobQueued(jobId: string) {
  const [row] = await db
    .update(conversionJobs)
    .set({ status: 'queued', updatedAt: new Date() })
    .where(eq(conversionJobs.id, jobId))
    .returning();
  return row ? toJob(row) : null;
}

export async function listExpiredJobs(cutoff: Date): Promise<ConversionJob[]> {
  const rows = await db
    .select()
    .from(conversionJobs)
    .where(
      and(
        inArray(conversionJobs.status, ['completed', 'failed']),
        lt(conversionJobs.updatedAt, cutoff)
      )
    );
  return rows.map(toJob);
}

export async function deleteJobRecords(jobIds: string[]): Promise<void> {
  if (jobIds.length === 0) return;
  await db.delete(conversionJobs).where(inArray(conversionJobs.id, jobIds));
}
