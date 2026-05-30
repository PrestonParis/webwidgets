import { NextResponse } from 'next/server';
import { createClients } from '@/lib/supabase/serverClient';
import {
    forbidden,
    requireAdminUser,
} from '@/features/admin/lib/adminPermissions';
import {
    apiTesterRequestSchema,
    type ApiTesterResponse,
} from '@/features/developer/schemas/infrastructureSchemas';

export const runtime = 'nodejs';

const SECRET_HEADER_PATTERNS = [
    /authorization/i,
    /cookie/i,
    /x-api-key/i,
    /apikey/i,
    /token/i,
    /secret/i,
];

function redactHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
        result[key] = SECRET_HEADER_PATTERNS.some((pattern) =>
            pattern.test(key),
        )
            ? '[REDACTED]'
            : value;
    });
    return result;
}

function isAllowedInternalPath(path: string) {
    return (
        path.startsWith('/api/') && !path.startsWith('/api/developer/api-test')
    );
}

export async function POST(req: Request) {
    const { supabase } = await createClients();
    try {
        await requireAdminUser(supabase);
    } catch {
        return forbidden();
    }

    const parsed = apiTesterRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
        return NextResponse.json(
            { error: parsed.error.flatten() },
            { status: 400 },
        );
    }

    const input = parsed.data;
    if (!isAllowedInternalPath(input.path)) {
        return NextResponse.json(
            { error: 'Only internal /api routes can be tested here.' },
            { status: 400 },
        );
    }

    if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(input.method) &&
        !input.confirmedDestructive
    ) {
        return NextResponse.json(
            { error: 'Destructive or mutating methods require confirmation.' },
            { status: 409 },
        );
    }

    const origin = new URL(req.url).origin;
    const target = new URL(input.path, origin);
    for (const [key, value] of Object.entries(input.query)) {
        if (value) target.searchParams.set(key, value);
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(input.headers)) {
        if (SECRET_HEADER_PATTERNS.some((pattern) => pattern.test(key))) {
            continue;
        }
        if (value) headers.set(key, value);
    }
    if (input.body && !headers.has('content-type')) {
        headers.set('content-type', 'application/json');
    }

    const startedAt = performance.now();
    const requestInit: RequestInit = {
        method: input.method,
        headers,
        redirect: 'manual',
        signal: AbortSignal.timeout(20_000),
    };
    if (input.method !== 'GET' && input.method !== 'DELETE' && input.body) {
        requestInit.body = input.body;
    }
    const response = await fetch(target, requestInit);

    const bodyText = await response.text();
    const payload: ApiTesterResponse = {
        status: response.status,
        statusText: response.statusText,
        durationMs: Math.round(performance.now() - startedAt),
        headers: redactHeaders(response.headers),
        bodyText,
        contentType: response.headers.get('content-type'),
    };

    return NextResponse.json(payload);
}
