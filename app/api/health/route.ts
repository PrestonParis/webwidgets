import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/adminClient';

interface Check {
    status: 'ok' | 'error';
    latencyMs?: number;
}

export async function GET(): Promise<Response> {
    const checks: Record<string, Check> = {};

    // Database connectivity
    const dbStart = performance.now();
    try {
        const supabase = createAdminClient();
        await supabase.from('user_tokens').select('user_id').limit(1);
        checks.database = {
            status: 'ok',
            latencyMs: Math.round(performance.now() - dbStart),
        };
    } catch {
        checks.database = {
            status: 'error',
            latencyMs: Math.round(performance.now() - dbStart),
        };
    }

    // ML service connectivity
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

    const allHealthy = Object.values(checks).every((c) => c.status === 'ok');

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
