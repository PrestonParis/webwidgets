import { type NextRequest, NextResponse } from 'next/server';

// Edge runtime: propagate correlation IDs across every API request.
// Server-side logger reads x-request-id from headers to populate requestId.
export function middleware(req: NextRequest): NextResponse {
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const res = NextResponse.next();
    res.headers.set('x-request-id', requestId);
    return res;
}

export const config = {
    matcher: ['/api/:path*'],
};
