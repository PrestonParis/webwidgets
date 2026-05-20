import type { ParsedRow } from '@/features/tracking/types/import';

export function detectDelimiter(content: string): ',' | ';' | '\t' {
    const firstLine = content.split('\n')[0] ?? '';
    const counts = {
        ',': (firstLine.match(/,/g) ?? []).length,
        ';': (firstLine.match(/;/g) ?? []).length,
        '\t': (firstLine.match(/\t/g) ?? []).length,
    };
    if (counts['\t'] >= counts[','] && counts['\t'] >= counts[';']) return '\t';
    if (counts[';'] > counts[',']) return ';';
    return ',';
}

export function parseCSV(content: string): ParsedRow[] {
    const lines = content
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
    if (lines.length < 2) return [];

    const delimiter = detectDelimiter(content);
    const headers = (lines[0] ?? '')
        .split(delimiter)
        .map((h) => h.trim().toLowerCase());

    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const values = line.split(delimiter);
        const raw: Record<string, string> = {};
        headers.forEach((header, idx) => {
            raw[header] = (values[idx] ?? '').trim();
        });
        rows.push({ rowIndex: i, raw });
    }
    return rows;
}
