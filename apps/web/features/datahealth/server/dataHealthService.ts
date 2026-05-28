import { createAdminClient } from '@/lib/supabase/adminClient';

export interface HealthCheck {
    status: 'ok' | 'error';
    message?: string;
}

export interface SystemDataHealth {
    status: 'ok' | 'degraded' | 'error';
    checks: Record<string, HealthCheck>;
    timestamp: string;
}

export async function getSystemDataHealth(): Promise<SystemDataHealth> {
    const checks: Record<string, HealthCheck> = {};

    try {
        const admin = createAdminClient();
        const { error } = await admin.from('profiles').select('id').limit(1);
        checks.database = error
            ? { status: 'error', message: error.message }
            : { status: 'ok' };
    } catch (e) {
        checks.database = {
            status: 'error',
            message: e instanceof Error ? e.message : 'unknown',
        };
    }

    const allOk = Object.values(checks).every((c) => c.status === 'ok');
    const anyError = Object.values(checks).some((c) => c.status === 'error');

    return {
        status: allOk ? 'ok' : anyError ? 'error' : 'degraded',
        checks,
        timestamp: new Date().toISOString(),
    };
}
