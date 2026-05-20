export type SafeHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface SafeApiConfig {
    url: string;
    method: SafeHttpMethod;
    headers: Record<string, string>;
    queryParams?: Record<string, string> | undefined;
    body?: string | undefined;
    timeoutMs?: number | undefined;
}

export interface ApiRequestResult {
    ok: boolean;
    status: number;
    data: unknown;
    error?: string | undefined;
    responseTimeMs: number;
}

const ALLOWED_METHODS: SafeHttpMethod[] = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
];
const BLOCKED_PROTOCOLS = ['ftp:', 'file:', 'javascript:', 'data:'];
const BLOCKED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '::1',
    '169.254.169.254',
    'metadata.google.internal',
];
const MAX_TIMEOUT_MS = 30000;
const SAFE_HEADER_PREFIX_BLOCKLIST = ['x-internal', 'x-admin', 'x-service'];

export function validateAllowedMethod(
    method: string,
): method is SafeHttpMethod {
    return ALLOWED_METHODS.includes(method.toUpperCase() as SafeHttpMethod);
}

export function validateAllowedUrl(url: string): {
    valid: boolean;
    reason?: string | undefined;
} {
    let parsed: URL;
    try {
        parsed = new URL(url);
    } catch {
        return { valid: false, reason: 'Invalid URL format' };
    }
    if (parsed.protocol !== 'https:')
        return { valid: false, reason: 'Only HTTPS URLs are allowed' };
    if (BLOCKED_PROTOCOLS.some((p) => url.startsWith(p)))
        return { valid: false, reason: 'Protocol not allowed' };
    if (
        BLOCKED_HOSTS.some(
            (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`),
        )
    )
        return { valid: false, reason: `Blocked host: ${parsed.hostname}` };
    return { valid: true };
}

export function validateHeaders(headers: Record<string, string>): {
    valid: boolean;
    issues: string[];
} {
    const issues: string[] = [];
    for (const key of Object.keys(headers)) {
        const lower = key.toLowerCase();
        if (SAFE_HEADER_PREFIX_BLOCKLIST.some((p) => lower.startsWith(p))) {
            issues.push(`Header ${key} is not allowed`);
        }
        if (lower === 'host' || lower === 'origin') {
            issues.push(`Header ${key} cannot be overridden`);
        }
    }
    return { valid: issues.length === 0, issues };
}

export function buildSafeApiConfig(raw: Record<string, unknown>): {
    config: SafeApiConfig | null;
    issues: string[];
} {
    const issues: string[] = [];
    const url = String(raw['url'] ?? '').trim();
    const method = String(raw['method'] ?? 'GET').toUpperCase();
    const headers =
        typeof raw['headers'] === 'object' && raw['headers'] !== null
            ? (raw['headers'] as Record<string, string>)
            : {};
    const body = raw['body'] !== undefined ? String(raw['body']) : undefined;
    const timeoutMs = Math.min(
        Number(raw['timeoutMs'] ?? 10000),
        MAX_TIMEOUT_MS,
    );

    const urlCheck = validateAllowedUrl(url);
    if (!urlCheck.valid) issues.push(urlCheck.reason ?? 'Invalid URL');
    if (!validateAllowedMethod(method))
        issues.push(`Method ${method} not allowed`);
    const headerCheck = validateHeaders(headers);
    issues.push(...headerCheck.issues);

    if (issues.length > 0) return { config: null, issues };
    return {
        config: {
            url,
            method: method as SafeHttpMethod,
            headers,
            ...(body !== undefined && { body }),
            timeoutMs,
        },
        issues: [],
    };
}

export function parseApiResponse(raw: unknown): {
    data: unknown;
    schema: Record<string, string>;
} {
    if (typeof raw !== 'object' || raw === null)
        return { data: raw, schema: { value: 'scalar' } };
    const schema: Record<string, string> = {};
    const obj = raw as Record<string, unknown>;
    for (const [key, val] of Object.entries(obj).slice(0, 20)) {
        if (Array.isArray(val)) schema[key] = 'array';
        else if (typeof val === 'object' && val !== null)
            schema[key] = 'object';
        else schema[key] = typeof val;
    }
    return { data: raw, schema };
}

export function mapResponseToWidgetSchema(
    data: unknown,
    fieldMap: Record<string, string>,
): Record<string, unknown> {
    if (typeof data !== 'object' || data === null) return {};
    const obj = data as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [from, to] of Object.entries(fieldMap)) {
        if (from in obj) result[to] = obj[from];
    }
    return result;
}

export function buildRateLimitKey(url: string, widgetId: string): string {
    try {
        return `ratelimit:${widgetId}:${new URL(url).hostname}`;
    } catch {
        return `ratelimit:${widgetId}:unknown`;
    }
}
