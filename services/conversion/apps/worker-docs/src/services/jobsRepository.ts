import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { bigint, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { ConversionJob } from '@webwidgets/conversion-shared';
import { env } from '../env.js';

const conversionJobs = pgTable('conversion_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    status: text('status').notNull(),
    kind: text('kind').notNull().default('document'),
    originalFileName: text('original_file_name').notNull(),
    sourceMime: text('source_mime').notNull(),
    sourceExtension: text('source_extension').notNull(),
    targetExtension: text('target_extension').notNull(),
    fileSizeBytes: bigint('file_size_bytes', { mode: 'number' }).notNull(),
    userId: text('user_id'),
    inputObjectKey: text('input_object_key').notNull(),
    outputObjectKey: text('output_object_key'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
});

const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
const db = drizzle(pool);

type Row = typeof conversionJobs.$inferSelect;

function toJob(row: Row): ConversionJob {
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

export async function getJob(jobId: string) {
    const [row] = await db
        .select()
        .from(conversionJobs)
        .where(eq(conversionJobs.id, jobId))
        .limit(1);
    return row ? toJob(row) : null;
}

export async function markProcessing(jobId: string) {
    await db
        .update(conversionJobs)
        .set({
            status: 'processing',
            errorMessage: null,
            updatedAt: new Date(),
        })
        .where(eq(conversionJobs.id, jobId));
}

export async function markCompleted(jobId: string, outputObjectKey: string) {
    await db
        .update(conversionJobs)
        .set({
            status: 'completed',
            outputObjectKey,
            errorMessage: null,
            updatedAt: new Date(),
        })
        .where(eq(conversionJobs.id, jobId));
}

export async function markFailed(jobId: string, errorMessage: string) {
    await db
        .update(conversionJobs)
        .set({
            status: 'failed',
            errorMessage,
            updatedAt: new Date(),
        })
        .where(eq(conversionJobs.id, jobId));
}
