import { NextRequest, NextResponse } from 'next/server';

const BASE = 'https://api.scripture.api.bible/v1';

// Allow only the endpoints the provider actually uses
const ALLOWED_PATH =
    /^\/bibles(\/[\w-]+(\/books(\/[\w-]+)?|\/chapters\/[\w.]+|\/search)?)?$/;

export async function GET(req: NextRequest) {
    const apiKey = process.env.BIBLE_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'Bible API key not configured' },
            { status: 503 },
        );
    }

    const path = req.nextUrl.searchParams.get('path');
    if (!path || !ALLOWED_PATH.test(path)) {
        return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const forwarded = new URLSearchParams(req.nextUrl.searchParams);
    forwarded.delete('path');
    const qs = forwarded.toString();
    const url = `${BASE}${path}${qs ? `?${qs}` : ''}`;

    // Search results are dynamic; books and chapters are effectively immutable
    const revalidate = path.includes('/search') ? 0 : 86_400;

    const res = await fetch(url, {
        headers: { 'api-key': apiKey },
        next: { revalidate },
    });

    const body: unknown = await res.json();
    return NextResponse.json(body, { status: res.status });
}
