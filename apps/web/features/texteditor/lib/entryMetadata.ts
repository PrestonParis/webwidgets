import { z } from 'zod';
import type { JournalEntry } from '@/features/journal/types/journal';

export const textEditorMetadataSchema = z
    .object({
        author: z.string().optional(),
        subject: z.string().optional(),
        tags: z.array(z.string()).optional(),
        displayDate: z.string().optional(),
        actualCreatedAt: z.string().optional(),
        dateModifiedByUser: z.boolean().optional(),
    })
    .catchall(z.unknown());

export type TextEditorEntryMetadata = z.infer<typeof textEditorMetadataSchema>;

export function parseTextEditorMetadata(
    value: JournalEntry['metadata'],
): TextEditorEntryMetadata {
    const parsed = textEditorMetadataSchema.safeParse(value ?? {});
    return parsed.success ? parsed.data : {};
}

export function getEntryDisplayDate(entry: JournalEntry) {
    return (
        parseTextEditorMetadata(entry.metadata).displayDate ?? entry.created_at
    );
}

export function parseTextEditorDisplayDate(value: string) {
    const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly) {
        return new Date(
            Number(dateOnly[1]),
            Number(dateOnly[2]) - 1,
            Number(dateOnly[3]),
        );
    }
    return new Date(value);
}

export function mergeTextEditorMetadata(
    entry: JournalEntry,
    patch: TextEditorEntryMetadata,
): TextEditorEntryMetadata {
    const current = parseTextEditorMetadata(entry.metadata);
    const displayDate = patch.displayDate?.trim();
    const dateModifiedByUser = Boolean(
        displayDate && displayDate !== entry.created_at.slice(0, 10),
    );

    return {
        ...current,
        ...patch,
        tags: patch.tags ?? current.tags ?? [],
        actualCreatedAt: current.actualCreatedAt ?? entry.created_at,
        ...(displayDate
            ? {
                  displayDate,
                  dateModifiedByUser,
              }
            : {
                  displayDate: undefined,
                  dateModifiedByUser: false,
              }),
    };
}

export function metadataTagsToText(tags: string[] | undefined) {
    return (tags ?? []).join(', ');
}

export function metadataTextToTags(value: string) {
    return value
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
}
