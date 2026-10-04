// lib/utils.ts
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility function to combine class names with Tailwind CSS merging
export function cn(...inputs: Parameters<typeof clsx>) {
    return twMerge(clsx(inputs));
}

/**
 * Safe string coercion for `unknown` values (untyped rows, parsed CSV/JSON
 * cells, `Record<string, unknown>` lookups). Primitives stringify as usual;
 * `null`/`undefined` become `''`; objects are JSON-encoded rather than
 * collapsing to the useless `"[object Object]"`.
 */
export function toText(value: unknown): string {
    if (value == null) return '';
    if (typeof value === 'string') return value;
    if (
        typeof value === 'number' ||
        typeof value === 'boolean' ||
        typeof value === 'bigint'
    ) {
        return String(value);
    }
    try {
        return JSON.stringify(value) ?? '';
    } catch {
        return '';
    }
}
