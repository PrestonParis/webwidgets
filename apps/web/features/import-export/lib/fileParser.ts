import Papa from 'papaparse';
import { toText } from '@/features/import-export/lib/coerce';
import type {
    ParseResult,
    ParsedRow,
    ParseError,
    ImportFormat,
    FieldTypeInfo,
    FieldType,
} from '@/features/import-export/types/importExport';

// ── CSV parsing ───────────────────────────────────────────────────────────────
export function parseCSV(content: string): ParseResult {
    const errors: ParseError[] = [];

    const result = Papa.parse<Record<string, string>>(content, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
    });

    if (result.errors.length > 0) {
        result.errors.forEach((e) => {
            errors.push({
                ...(e.row != null ? { row: e.row } : {}),
                message: e.message,
                type: 'parse',
            });
        });
    }

    const headers = result.meta.fields ?? [];
    const rows: ParsedRow[] = result.data.map((raw, index) => ({
        rowIndex: index,
        raw,
    }));

    return {
        headers,
        rows,
        totalRows: rows.length,
        errors,
    };
}

// ── JSON parsing ──────────────────────────────────────────────────────────────
export function parseJSON(content: string): ParseResult {
    const errors: ParseError[] = [];

    let parsed: unknown;
    try {
        parsed = JSON.parse(content);
    } catch (e) {
        return {
            headers: [],
            rows: [],
            totalRows: 0,
            errors: [
                {
                    message: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
                    type: 'parse',
                },
            ],
        };
    }

    const items = Array.isArray(parsed)
        ? (parsed as Record<string, unknown>[])
        : typeof parsed === 'object' &&
            parsed !== null &&
            'data' in parsed &&
            Array.isArray((parsed as Record<string, unknown>)['data'])
          ? ((parsed as Record<string, unknown>)['data'] as Record<
                string,
                unknown
            >[])
          : null;

    if (!items) {
        return {
            headers: [],
            rows: [],
            totalRows: 0,
            errors: [
                {
                    message:
                        'Expected a JSON array or an object with a "data" array',
                    type: 'format',
                },
            ],
        };
    }

    // Collect all headers from all objects
    const headerSet = new Set<string>();
    items.forEach((item) => {
        if (typeof item === 'object' && item !== null) {
            Object.keys(item).forEach((k) => headerSet.add(k));
        }
    });
    const headers = Array.from(headerSet);

    const rows: ParsedRow[] = items.map((item, index) => {
        const raw: Record<string, string> = {};
        headers.forEach((h) => {
            raw[h] = toText(item[h]);
        });
        return { rowIndex: index, raw };
    });

    return { headers, rows, totalRows: rows.length, errors };
}

// ── Format detection ──────────────────────────────────────────────────────────
export function detectFormat(
    filename: string,
    mimeType: string,
): ImportFormat | null {
    const ext = filename.split('.').pop()?.toLowerCase() ?? '';

    if (ext === 'csv' || mimeType === 'text/csv') return 'csv';
    if (ext === 'json' || mimeType === 'application/json') return 'json';

    // XLSX is not supported — no package installed
    if (ext === 'xlsx' || ext === 'xls' || mimeType.includes('spreadsheet'))
        return 'xlsx';

    return null;
}

// ── Field type inference ──────────────────────────────────────────────────────
const ISO_DATE = /^\d{4}-\d{2}-\d{2}(T[\d:.Z+\-]+)?$/;
const NUMERIC = /^-?\d+(\.\d+)?$/;
const BOOLEAN = /^(true|false|yes|no|1|0)$/i;

function inferSingleType(value: string): FieldType {
    if (!value.trim()) return 'unknown';
    if (BOOLEAN.test(value.trim())) return 'boolean';
    if (ISO_DATE.test(value.trim())) return 'date';
    if (NUMERIC.test(value.trim())) return 'number';
    return 'string';
}

export function inferFieldTypes(rows: ParsedRow[]): FieldTypeInfo[] {
    if (rows.length === 0) return [];

    const headers = Object.keys(rows[0]?.raw ?? {});
    const sample = rows.slice(0, 20);

    return headers.map((col) => {
        const values = sample
            .map((r) => r.raw[col] ?? '')
            .filter((v) => v !== '');
        const sampleValues = values.slice(0, 5);

        const typeCounts: Record<FieldType, number> = {
            string: 0,
            number: 0,
            boolean: 0,
            date: 0,
            unknown: 0,
        };

        values.forEach((v) => {
            typeCounts[inferSingleType(v)]++;
        });

        // Remove unknowns from scoring
        const totalNonEmpty = values.filter((v) => v !== '').length;
        const bestType = (Object.keys(typeCounts) as FieldType[])
            .filter((t) => t !== 'unknown')
            .reduce<FieldType>(
                (best, t) =>
                    typeCounts[t] > (typeCounts[best] ?? 0) ? t : best,
                'string',
            );

        const confidence =
            totalNonEmpty > 0 ? typeCounts[bestType] / totalNonEmpty : 0;

        return {
            column: col,
            inferredType: confidence > 0.6 ? bestType : 'string',
            sampleValues,
            confidence,
        };
    });
}

// ── Parse dispatcher ──────────────────────────────────────────────────────────
export function parseContent(
    content: string,
    format: ImportFormat,
): ParseResult {
    switch (format) {
        case 'csv':
            return parseCSV(content);
        case 'json':
            return parseJSON(content);
        case 'xlsx':
            // XLSX not supported — xlsx package not installed
            return {
                headers: [],
                rows: [],
                totalRows: 0,
                errors: [
                    {
                        message:
                            'XLSX_NOT_SUPPORTED: Install the xlsx package to enable Excel file imports.',
                        type: 'format',
                    },
                ],
            };
    }
}
