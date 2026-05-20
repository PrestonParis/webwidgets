import { z } from 'zod';

export const serviceCheckSchema = z.object({
    status: z.enum(['ok', 'error']),
    latencyMs: z.number().optional(),
});

export const serviceHealthSchema = z.object({
    status: z.enum(['ok', 'degraded']),
    timestamp: z.string(),
    version: z.string(),
    checks: z.record(z.string(), serviceCheckSchema),
});

export type ServiceHealth = z.infer<typeof serviceHealthSchema>;
export type ServiceCheck = z.infer<typeof serviceCheckSchema>;

export async function checkSupabaseRest(): Promise<ServiceCheck | undefined> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnon) return undefined;

    const startedAt = performance.now();
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: { apikey: supabaseAnon },
            signal: AbortSignal.timeout(3000),
        });
        return {
            status: res.ok ? 'ok' : 'error',
            latencyMs: Math.round(performance.now() - startedAt),
        };
    } catch {
        return {
            status: 'error',
            latencyMs: Math.round(performance.now() - startedAt),
        };
    }
}

export async function checkMlService(): Promise<ServiceCheck | undefined> {
    const mlUrl = process.env.ML_SERVICE_URL;
    if (!mlUrl) return undefined;

    const startedAt = performance.now();
    try {
        const res = await fetch(`${mlUrl}/docs`, {
            signal: AbortSignal.timeout(2000),
        });
        return {
            status: res.ok ? 'ok' : 'error',
            latencyMs: Math.round(performance.now() - startedAt),
        };
    } catch {
        return {
            status: 'error',
            latencyMs: Math.round(performance.now() - startedAt),
        };
    }
}
