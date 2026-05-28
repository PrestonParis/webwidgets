import Papa from 'papaparse';
import type { ViewParseInput } from '@/features/view/types/view';
import { normalizedDocument } from '@/features/view/parsers/parserUtils';

export function parseCsvFile(input: ViewParseInput) {
    const text = input.text ?? '';
    const parsed = Papa.parse<Record<string, unknown>>(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
    });
    const rows = parsed.data.slice(0, 500);
    const fields = parsed.meta.fields ?? Object.keys(rows[0] ?? {});

    return Promise.resolve(
        normalizedDocument({
            file: input.file,
            strategy: 'csv_table',
            searchableText: text,
            renderable: { rows, fields, errors: parsed.errors.slice(0, 5) },
            metadata: {
                rowCount: parsed.data.length,
                fields,
                truncated: parsed.data.length > rows.length,
            },
            analysisHints: [
                'schema-inference',
                'statistics',
                'timeline-extraction',
            ],
            sanitized: true,
        }),
    );
}
