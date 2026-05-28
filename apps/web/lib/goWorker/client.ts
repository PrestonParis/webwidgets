/**
 * Client for communicating with the Go worker service.
 * All calls are best-effort and should not block user flows.
 */

import type {
    CacheWriteRequest,
    CacheWriteResponse,
    GoWorkerIngestRequest,
    GoWorkerIngestResponse,
    SnapshotPrecomputeRequest,
    SnapshotPrecomputeResponse,
    WorkerHealthResponse,
    WorkerReadyResponse,
} from './types';

const DEFAULT_TIMEOUT_MS = 5000;

export class GoWorkerClient {
    private baseUrl: string;
    private enabled: boolean;
    private timeoutMs: number;

    constructor(options: {
        baseUrl?: string;
        enabled?: boolean;
        timeoutMs?: number;
    }) {
        this.baseUrl =
            options.baseUrl ??
            process.env.GO_WORKER_URL ??
            'http://localhost:8081';
        this.enabled =
            options.enabled ?? process.env.GO_WORKER_ENABLED === 'true';
        this.timeoutMs =
            options.timeoutMs ??
            Number(process.env.GO_WORKER_TIMEOUT_MS ?? DEFAULT_TIMEOUT_MS);
    }

    /**
     * Check if the Go worker is enabled and available
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Health check - returns true if worker is healthy
     */
    async healthCheck(): Promise<boolean> {
        if (!this.enabled) return false;

        try {
            const response =
                await this.fetchWithTimeout<WorkerHealthResponse>('/healthz');
            return response.status === 'ok';
        } catch {
            return false;
        }
    }

    /**
     * Readiness check - returns true if worker is ready to accept traffic
     */
    async readinessCheck(): Promise<boolean> {
        if (!this.enabled) return false;

        try {
            const response =
                await this.fetchWithTimeout<WorkerReadyResponse>('/readyz');
            return response.status === 'ready';
        } catch {
            return false;
        }
    }

    /**
     * Ingest analytics events
     * Returns accepted/rejected counts, or null if worker is unavailable
     */
    async ingestEvents(
        request: GoWorkerIngestRequest,
    ): Promise<GoWorkerIngestResponse | null> {
        if (!this.enabled) return null;

        try {
            return await this.fetchWithTimeout<GoWorkerIngestResponse>(
                '/v1/events/ingest',
                {
                    method: 'POST',
                    body: JSON.stringify(request),
                },
            );
        } catch (error) {
            console.error('[GoWorker] ingestEvents failed:', error);
            return null;
        }
    }

    /**
     * Enqueue a cache write job
     * Returns queued status, or null if worker is unavailable
     */
    async writeCache(
        request: CacheWriteRequest,
    ): Promise<CacheWriteResponse | null> {
        if (!this.enabled) return null;

        try {
            return await this.fetchWithTimeout<CacheWriteResponse>(
                '/v1/cache/write',
                {
                    method: 'POST',
                    body: JSON.stringify(request),
                },
            );
        } catch (error) {
            console.error('[GoWorker] writeCache failed:', error);
            return null;
        }
    }

    /**
     * Enqueue a snapshot precompute job
     * Returns queued status, or null if worker is unavailable
     */
    async precomputeSnapshot(
        request: SnapshotPrecomputeRequest,
    ): Promise<SnapshotPrecomputeResponse | null> {
        if (!this.enabled) return null;

        try {
            return await this.fetchWithTimeout<SnapshotPrecomputeResponse>(
                '/v1/jobs/snapshot-precompute',
                {
                    method: 'POST',
                    body: JSON.stringify(request),
                },
            );
        } catch (error) {
            console.error('[GoWorker] precomputeSnapshot failed:', error);
            return null;
        }
    }

    private async fetchWithTimeout<T>(
        path: string,
        options: RequestInit = {},
    ): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers,
                },
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`,
                );
            }

            return (await response.json()) as T;
        } finally {
            clearTimeout(timeoutId);
        }
    }
}

// Singleton instance
let clientInstance: GoWorkerClient | null = null;

export function getGoWorkerClient(): GoWorkerClient {
    if (!clientInstance) {
        clientInstance = new GoWorkerClient({});
    }
    return clientInstance;
}
