import { type NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest): NextResponse {
    const requestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const res = NextResponse.next();
    res.headers.set('x-request-id', requestId);
    return res;
}

export const config = {
    matcher: ['/api/:path*'],
};
