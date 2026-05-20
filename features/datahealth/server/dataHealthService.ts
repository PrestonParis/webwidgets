import {
    checkMlService,
    checkSupabaseRest,
    serviceHealthSchema,
    type ServiceHealth,
} from '@/lib/connectors/serviceHealth';

export async function getSystemDataHealth(): Promise<ServiceHealth> {
    const [database, mlService] = await Promise.all([
        checkSupabaseRest(),
        checkMlService(),
    ]);

    const checks = {
        ...(database ? { database } : {}),
        ...(mlService ? { ml_service: mlService } : {}),
    };
    const allHealthy =
        Object.keys(checks).length === 0 ||
        Object.values(checks).every((check) => check.status === 'ok');

    return serviceHealthSchema.parse({
        status: allHealthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version ?? 'unknown',
        checks,
    });
}
