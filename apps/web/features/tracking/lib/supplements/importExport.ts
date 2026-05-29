import { parseCSV } from '@/features/tracking/lib/import/csvParser';
import type { ImportPreview } from '@/features/tracking/types/fitnessImport';
import type { SupplementLog } from '@/features/tracking/types/supplementLogs';

function get(row: Record<string, string>, keys: string[]): string | undefined {
    for (const key of keys) {
        const value = row[key.toLowerCase()];
        if (value) return value;
    }
    return undefined;
}

export function mapSupplementCsv(input: string): ImportPreview {
    const parsed = parseCSV(input);
    const seen = new Set<string>();
    const rows = parsed.map((row) => {
        const name = get(row.raw, ['name', 'supplement', 'supplement name']);
        const date = get(row.raw, ['date', 'entry_date', 'taken date']);
        const time = get(row.raw, ['time', 'taken time']);
        const status = get(row.raw, ['status', 'taken']) ?? 'taken';
        const key = `${name ?? ''}:${date ?? ''}:${time ?? ''}:${status}`;
        const duplicate = seen.has(key);
        seen.add(key);
        const issues: string[] = [];
        if (!name) issues.push('Missing supplement name');
        if (!date) issues.push('Missing date');
        return {
            rowIndex: row.rowIndex,
            status: duplicate
                ? ('duplicate' as const)
                : issues.length > 0
                  ? ('skipped' as const)
                  : ('ready' as const),
            issues: duplicate ? ['Duplicate supplement log'] : issues,
        };
    });
    return {
        provider: 'supplement-csv',
        total: rows.length,
        ready: rows.filter((row) => row.status === 'ready').length,
        duplicates: rows.filter((row) => row.status === 'duplicate').length,
        skipped: rows.filter((row) => row.status === 'skipped').length,
        rows,
    };
}

export function exportSupplementLogsCsv(logs: SupplementLog[]): string {
    const header = [
        'date',
        'time',
        'name',
        'brand',
        'status',
        'dose_amount',
        'dose_unit',
        'skip_reason',
        'notes',
    ];
    const rows = logs.map((log) =>
        [
            log.date,
            log.time ?? '',
            log.name,
            log.brand ?? '',
            log.status,
            log.doseAmount ?? '',
            log.doseUnit ?? '',
            log.skipReason ?? '',
            log.notes ?? '',
        ]
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(','),
    );
    return [header.join(','), ...rows].join('\n');
}
