import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const viewDocumentTable = pgTable('view_documents', {
    id: text('id').primaryKey(),
    ownerId: text('owner_id').notNull(),
    fileName: text('file_name').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    category: text('category').notNull(),
    metadata: jsonb('metadata').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const insertViewDocumentSchema = createInsertSchema(viewDocumentTable);
export const selectViewDocumentSchema = createSelectSchema(viewDocumentTable);
