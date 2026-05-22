import type { NextRequest } from 'next/server';

export function getConversionApiUrl(path: string) {
    const base =
        process.env.CONVERSION_API_URL ??
        process.env.NEXT_PUBLIC_CONVERSION_API_URL ??
        'http://localhost:4010';
    return `${base.replace(/\/$/, '')}${path}`;
}

export async function proxyConversionRequest(request: NextRequest, path: string) {
    const headers: Record<string, string> = {
        'content-type': request.headers.get('content-type') ?? 'application/json',
    };

    // Inject the service auth key server-side so it is never exposed to the browser.
    const apiKey = process.env.CONVERSION_API_KEY;
    if (apiKey) {
        headers['x-conversion-api-key'] = apiKey;
    }

    const init: RequestInit = {
        method: request.method,
        headers,
        cache: 'no-store',
    };
    if (request.method !== 'GET') {
        const bodyText = await request.text();
        if (bodyText) {
            init.body = bodyText;
        } else {
            delete headers['content-type'];
        }
    }

    return fetch(getConversionApiUrl(path), init);
}
