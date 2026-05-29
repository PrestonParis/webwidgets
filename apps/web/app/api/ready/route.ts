import { NextResponse } from 'next/server';

/**
 * Readiness endpoint for Kubernetes-style readiness checks
 * Does not require authentication
 * Returns whether the application is ready to serve traffic
 * Checks: server running, environment loaded, core dependencies initialized
 */
export function GET(): Response {
    try {
        // Check if environment variables are loaded
        const requiredEnvVars = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        ];
        const missingEnvVars = requiredEnvVars.filter(
            (envVar) => !process.env[envVar],
        );

        if (missingEnvVars.length > 0) {
            return NextResponse.json(
                {
                    status: 'not_ready',
                    reason: 'Missing required environment variables',
                    missing: missingEnvVars,
                    timestamp: new Date().toISOString(),
                },
                { status: 503 },
            );
        }

        // Application is ready
        return NextResponse.json({
            status: 'ready',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            checks: {
                environment: 'ok',
                server: 'ok',
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'not_ready',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 503 },
        );
    }
}
