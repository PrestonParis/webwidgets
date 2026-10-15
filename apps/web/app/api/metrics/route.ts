import { timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { registry, setV1OperationalMetrics } from '@/lib/observability/metrics';

// Prometheus scrape endpoint. Protect with METRICS_SECRET env var in production.
// Add to prometheus.yml:
//   - job_name: 'dashboard'
//     bearer_token: '<METRICS_SECRET>'
//     static_configs:
//       - targets: ['your-domain.com']
//     metrics_path: '/api/metrics'
export async function GET(req: Request): Promise<Response> {
    const secret = process.env.METRICS_SECRET;
    const supplied = req.headers
        .get('authorization')
        ?.replace(/^Bearer\s+/i, '');
    if (!secret) {
        return NextResponse.json(
            { error: 'Metrics are not configured' },
            { status: 503 },
        );
    }
    const expectedBytes = Buffer.from(secret);
    const suppliedBytes = Buffer.from(supplied ?? '');
    if (
        expectedBytes.length !== suppliedBytes.length ||
        !timingSafeEqual(expectedBytes, suppliedBytes)
    ) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const snapshot = await admin.rpc('get_v1_operations_snapshot');
    if (snapshot.error) {
        return NextResponse.json(
            { error: 'Operational metrics unavailable' },
            { status: 503 },
        );
    }
    setV1OperationalMetrics(snapshot.data);
    const metrics = await registry.metrics();
    return new Response(metrics, {
        headers: { 'Content-Type': registry.contentType },
    });
}
