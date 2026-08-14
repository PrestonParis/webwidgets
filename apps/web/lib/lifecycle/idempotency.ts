import type { Json } from '@/types/supabase';

export function canonicalizeJson(value: Json): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }
    if (Array.isArray(value)) {
        return `[${value.map(canonicalizeJson).join(',')}]`;
    }
    const entries = Object.entries(value)
        .filter((entry): entry is [string, Json] => entry[1] !== undefined)
        .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries
        .map(
            ([key, entry]) =>
                `${JSON.stringify(key)}:${canonicalizeJson(entry)}`,
        )
        .join(',')}}`;
}

export async function sha256Text(value: string): Promise<string> {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)]
        .map((byte) => byte.toString(16).padStart(2, '0'))
        .join('');
}

export function buildObservationKey(input: {
    sourceKey: string;
    providerObjectId: string;
    providerVersion: string;
    eventType: string;
}): string {
    return [
        'observation',
        input.sourceKey,
        input.providerObjectId,
        input.providerVersion,
        input.eventType,
    ]
        .map(encodeURIComponent)
        .join(':');
}

export function buildTimelineKey(input: {
    sourceKey: string;
    providerObjectId: string;
    eventType: string;
}): string {
    return [
        'timeline',
        input.sourceKey,
        input.providerObjectId,
        input.eventType,
    ]
        .map(encodeURIComponent)
        .join(':');
}

export async function hashJson(value: Json): Promise<string> {
    return sha256Text(canonicalizeJson(value));
}
