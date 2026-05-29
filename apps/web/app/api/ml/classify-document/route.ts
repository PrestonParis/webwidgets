import { NextRequest, NextResponse } from 'next/server';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL;

export async function POST(req: NextRequest) {
    if (!ML_SERVICE_URL)
        return NextResponse.json(
            { error: 'ML service not configured' },
            { status: 503 },
        );
    try {
        const body: unknown = await req.json();
        const res = await fetch(`${ML_SERVICE_URL}/classify-document`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(5000),
        });
        if (!res.ok) throw new Error(`ML error: ${res.status}`);
        return NextResponse.json(await res.json());
    } catch (err) {
        console.error('[ml/classify-document]', err);
        return NextResponse.json(
            { error: 'ML service unavailable' },
            { status: 503 },
        );
    }
}
