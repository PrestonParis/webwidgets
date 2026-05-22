import { createHash } from 'crypto';

const SENSITIVE_KEYS = [
    'body',
    'content',
    'apiKey',
    'api_key',
    'access_token',
    'refresh_token',
];

export function hashInferenceInput(input: unknown) {
    return createHash('sha256')
        .update(JSON.stringify(redactSensitive(input)))
        .digest('hex');
}

export function redactSensitive(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(redactSensitive);
    if (!value || typeof value !== 'object') return value;
    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [
            key,
            SENSITIVE_KEYS.includes(key) ? '[REDACTED]' : redactSensitive(item),
        ]),
    );
}
