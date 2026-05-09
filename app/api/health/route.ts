import { NextResponse } from 'next/server';

interface Check {
    status: 'ok' | 'error';
    latencyMs?: number;
}

export async function GET(): Promise<Response> {
    const checks: Record<string, Check> = {};

    // Database — ping the Supabase REST endpoint with the public anon key.
    // Avoids importing the service-role admin client (no secret key needed).
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseAnon) {
        const dbStart = performance.now();
        try {
            const res = await fetch(`${supabaseUrl}/rest/v1/`, {
                headers: { apikey: supabaseAnon },
                signal: AbortSignal.timeout(3000),
            });
            checks.database = {
                status: res.ok ? 'ok' : 'error',
                latencyMs: Math.round(performance.now() - dbStart),
            };
        } catch {
            checks.database = {
                status: 'error',
                latencyMs: Math.round(performance.now() - dbStart),
            };
        }
    }

    // ML service — optional, only checked when configured
    const mlUrl = process.env.ML_SERVICE_URL;
    if (mlUrl) {
        const mlStart = performance.now();
        try {
            const res = await fetch(`${mlUrl}/docs`, {
                signal: AbortSignal.timeout(2000),
            });
            checks.ml_service = {
                status: res.ok ? 'ok' : 'error',
                latencyMs: Math.round(performance.now() - mlStart),
            };
        } catch {
            checks.ml_service = {
                status: 'error',
                latencyMs: Math.round(performance.now() - mlStart),
            };
        }
    }

    const allHealthy =
        Object.keys(checks).length === 0 ||
        Object.values(checks).every((c) => c.status === 'ok');

    return NextResponse.json(
        {
            status: allHealthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version ?? 'unknown',
            checks,
        },
        { status: allHealthy ? 200 : 503 },
    );
}
