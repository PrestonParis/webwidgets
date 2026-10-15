interface ExportRow {
    data: Record<string, unknown>;
}

function stringifyValue(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return String(value);
    }
    if (typeof value === 'symbol') return value.description ?? '';
    try {
        return JSON.stringify(value) ?? '';
    } catch {
        return '[unserializable]';
    }
}

function escapeValue(value: unknown): string {
    const serialized = stringifyValue(value);
    return serialized.includes(',') ||
        serialized.includes('"') ||
        serialized.includes('\n')
        ? `"${serialized.replaceAll('"', '""')}"`
        : serialized;
}

export function rowsToCSV(rows: ExportRow[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]?.data ?? {});
    const lines = [
        headers.join(','),
        ...rows.map((row) =>
            headers.map((header) => escapeValue(row.data[header])).join(','),
        ),
    ];
    return lines.join('\n');
}
