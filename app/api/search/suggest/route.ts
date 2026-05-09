import { NextRequest, NextResponse } from 'next/server';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';

export async function POST(req: NextRequest) {
    const body = (await req.json()) as { query?: string; top_k?: number };

    if (!body.query?.trim()) {
        return NextResponse.json({ suggestions: [], suggest_ai: false });
    }

    try {
        const res = await fetch(`${ML_SERVICE_URL}/suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: body.query, top_k: body.top_k ?? 3 }),
            signal: AbortSignal.timeout(3000),
        });

        if (!res.ok) {
            return NextResponse.json({ suggestions: [], suggest_ai: true });
        }

        const data = (await res.json()) as {
            suggestions: { widget: string; confidence: number }[];
            suggest_ai: boolean;
        };
        return NextResponse.json(data);
    } catch {
        return NextResponse.json({ suggestions: [], suggest_ai: true });
    }
}
