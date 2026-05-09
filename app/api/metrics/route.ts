import { NextResponse } from 'next/server';
import { registry } from '@/lib/observability/metrics';

// Prometheus scrape endpoint. Protect with METRICS_SECRET env var in production.
// Add to prometheus.yml:
//   - job_name: 'dashboard'
//     bearer_token: '<METRICS_SECRET>'
//     static_configs:
//       - targets: ['your-domain.com']
//     metrics_path: '/api/metrics'
export async function GET(req: Request): Promise<Response> {
    const secret = process.env.METRICS_SECRET;
    if (secret) {
        const auth = req.headers.get('authorization');
        if (auth !== `Bearer ${secret}`) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    }

    const metrics = await registry.metrics();
    return new Response(metrics, {
        headers: { 'Content-Type': registry.contentType },
    });
}
