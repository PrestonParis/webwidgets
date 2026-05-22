import type {
    ParsedRow,
    ImportRecord,
    ImportSummary,
} from '@/features/tracking/types/import';
import {
    inferCategory,
    extractEntryDate,
    buildMetadata,
} from './categoryMapper';

function validateRecord(row: ParsedRow): ImportRecord {
    const issues: string[] = [];
    const category = inferCategory(row);
    const entryDate = extractEntryDate(row);

    if (!category) issues.push('Could not determine category');
    if (!entryDate) issues.push('Missing or invalid date');

    const metadata = category ? buildMetadata(row, category) : {};
    const tags: string[] = [];

    const rawTags = row.raw['tags'] ?? row.raw['tag'] ?? '';
    if (rawTags) {
        tags.push(
            ...rawTags
                .split(/[,;]/)
                .map((t) => t.trim())
                .filter(Boolean),
        );
    }

    const notes = row.raw['notes'] ?? row.raw['note'] ?? undefined;

    const record: ImportRecord = {
        rowIndex: row.rowIndex,
        category,
        entryDate,
        metadata,
        tags,
        issues,
        ...(notes !== undefined && notes !== '' && { notes }),
    };

    return record;
}

export function validateAndMap(rows: ParsedRow[]): ImportSummary {
    const records = rows.map(validateRecord);
    const valid = records.filter((r) => r.issues.length === 0).length;
    const invalid = records.length - valid;

    return {
        total: records.length,
        valid,
        invalid,
        records,
    };
}
