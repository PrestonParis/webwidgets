export function normalizeDate(value: unknown): string | null {
    if (!value) return null;
    const s = String(value).trim();
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function normalizeCurrency(value: unknown, decimals = 2): number | null {
    if (value === null || value === undefined) return null;
    const n = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    return isNaN(n) ? null : parseFloat(n.toFixed(decimals));
}

export function normalizeNumber(
    value: unknown,
    fallback: number | null = null,
): number | null {
    if (value === null || value === undefined) return fallback;
    const n = Number(value);
    return isNaN(n) ? fallback : n;
}

export function removeInvalidRows<T extends Record<string, unknown>>(
    rows: T[],
    requiredFields: string[],
): T[] {
    return rows.filter((row) =>
        requiredFields.every(
            (field) =>
                row[field] !== null &&
                row[field] !== undefined &&
                row[field] !== '',
        ),
    );
}

export function deduplicateRows<T extends Record<string, unknown>>(
    rows: T[],
    keyField: string,
): T[] {
    const seen = new Set<unknown>();
    return rows.filter((row) => {
        const key = row[keyField];
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export function sanitizeString(value: unknown, maxLength = 1000): string {
    if (value === null || value === undefined) return '';
    return String(value)
        .trim()
        .replace(/[\x00-\x1F\x7F]/g, '')
        .slice(0, maxLength);
}

export function validateJson(raw: string): {
    valid: boolean;
    data: unknown;
    error?: string | undefined;
} {
    try {
        const data: unknown = JSON.parse(raw);
        return { valid: true, data };
    } catch (e) {
        return {
            valid: false,
            data: null,
            error: e instanceof Error ? e.message : 'Invalid JSON',
        };
    }
}

export function validateApiPayload(payload: unknown): {
    valid: boolean;
    issues: string[];
} {
    const issues: string[] = [];
    if (payload === null || payload === undefined)
        return { valid: true, issues };
    if (typeof payload !== 'object')
        issues.push('Payload must be an object or null');
    else {
        const obj = payload as Record<string, unknown>;
        for (const [key, val] of Object.entries(obj)) {
            if (typeof val === 'function')
                issues.push(
                    `Field ${key}: functions are not allowed in payloads`,
                );
            if (typeof val === 'symbol')
                issues.push(
                    `Field ${key}: symbols are not allowed in payloads`,
                );
        }
    }
    return { valid: issues.length === 0, issues };
}

export function pickFields<T extends Record<string, unknown>>(
    rows: T[],
    fields: string[],
): Record<string, unknown>[] {
    return rows.map((row) =>
        Object.fromEntries(
            fields.filter((f) => f in row).map((f) => [f, row[f]]),
        ),
    );
}

export function renameFields<T extends Record<string, unknown>>(
    rows: T[],
    mapping: Record<string, string>,
): Record<string, unknown>[] {
    return rows.map((row) => {
        const out: Record<string, unknown> = { ...row };
        for (const [from, to] of Object.entries(mapping)) {
            if (from in out) {
                out[to] = out[from];
                delete out[from];
            }
        }
        return out;
    });
}

export function mapToCategories<T extends Record<string, unknown>>(
    rows: T[],
    field: string,
    categoryMap: Record<string, string>,
    fallback = 'other',
): Record<string, unknown>[] {
    return rows.map((row) => ({
        ...row,
        [field]: categoryMap[String(row[field])] ?? fallback,
    }));
}
