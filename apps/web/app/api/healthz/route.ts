import { NextResponse } from 'next/server';

/**
 * Public health endpoint for Kubernetes-style health checks
 * Does not require authentication
 * Returns basic server health status
 */
export function GET(): Response {
    try {
        // Basic health check - server is running
        return NextResponse.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString(),
            },
            { status: 503 },
        );
    }
}
