import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { proxyConversionRequest } from '@/features/convert/api/convertRouteHelpers';

type Params = Promise<{ path: string[] }>;

async function handle(request: NextRequest, { params }: { params: Params }) {
    const { path } = await params;
    const { search } = new URL(request.url);
    const apiPath = `/${path.join('/')}${search}`;

    try {
        return await proxyConversionRequest(request, apiPath);
    } catch {
        return NextResponse.json(
            { error: 'Conversion service unavailable.' },
            { status: 502 },
        );
    }
}

export { handle as GET, handle as POST };
