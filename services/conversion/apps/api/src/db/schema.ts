import {
    bigint,
    integer,
    pgTable,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core';

export const conversionBatches = pgTable('conversion_batches', {
    id: uuid('id').primaryKey().defaultRandom(),
    status: text('status').notNull().default('pending'),
    totalJobs: integer('total_jobs').notNull(),
    completedJobs: integer('completed_jobs').notNull().default(0),
    failedJobs: integer('failed_jobs').notNull().default(0),
    userId: text('user_id'),
    createdAt: timestamp('created_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const conversionJobs = pgTable('conversion_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    batchId: uuid('batch_id').references(() => conversionBatches.id),
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

export type ConversionBatchRow = typeof conversionBatches.$inferSelect;
export type NewConversionBatchRow = typeof conversionBatches.$inferInsert;
export type ConversionJobRow = typeof conversionJobs.$inferSelect;
export type NewConversionJobRow = typeof conversionJobs.$inferInsert;
