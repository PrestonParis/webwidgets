import { z } from 'zod';

export const AUTOMATION_CONTRACT_VERSION = '2.0' as const;

export type JsonValue =
    | boolean
    | number
    | string
    | null
    | JsonValue[]
    | { [key: string]: JsonValue };

function isJsonValue(value: unknown): value is JsonValue {
    if (value === null) return true;
    if (['boolean', 'number', 'string'].includes(typeof value)) return true;
    if (Array.isArray(value)) return value.every(isJsonValue);
    if (typeof value !== 'object') return false;
    return Object.values(value).every(isJsonValue);
}

export const jsonValueSchema = z.custom<JsonValue>(
    isJsonValue,
    'Expected JSON-compatible data',
);
export const jsonObjectSchema = z.record(z.string(), jsonValueSchema);
export const timestampSchema = z.string().datetime({ offset: true });
export const nullableTimestampSchema = timestampSchema.nullable();
export const contentHashSchema = z.string().min(16).max(200);
export const identifierSchema = z.string().min(1).max(240);
export const contractVersionSchema = z.literal(AUTOMATION_CONTRACT_VERSION);

export const riskClassSchema = z.enum([
    'read',
    'draft',
    'reversible_write',
    'external',
    'sensitive',
    'destructive',
    'prohibited',
]);

function canonicalizeJson(value: JsonValue): JsonValue {
    if (Array.isArray(value)) return value.map(canonicalizeJson);
    if (value === null || typeof value !== 'object') return value;
    return Object.fromEntries(
        Object.entries(value)
            .sort(([left], [right]) => left.localeCompare(right))
            .map(([key, entry]) => [key, canonicalizeJson(entry)]),
    );
}

export function serializeJson(value: JsonValue): string {
    return JSON.stringify(canonicalizeJson(value));
}
