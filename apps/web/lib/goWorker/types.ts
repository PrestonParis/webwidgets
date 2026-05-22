/**
 * Shared contracts between Next.js and Go worker service.
 * These types must match the Go structs in go_services/worker/internal/events/events.go
 */

/**
 * Event envelope for analytics ingestion
 */
export interface GoWorkerEvent {
	type: string;
	user_id?: string;
	source?: string;
	timestamp?: string;
	metadata?: Record<string, unknown>;
}

/**
 * Batch ingest request for Go worker
 */
export interface GoWorkerIngestRequest {
	events: GoWorkerEvent[];
}

/**
 * Ingest response from Go worker
 */
export interface GoWorkerIngestResponse {
	accepted: number;
	rejected: number;
}

/**
 * Cache write job for async cache operations
 */
export interface CacheWriteJob {
	key: string;
	namespace: string;
	value: unknown;
	ttl_seconds?: number;
}

/**
 * Cache write request for Go worker
 */
export interface CacheWriteRequest {
	job: CacheWriteJob;
}

/**
 * Cache write response from Go worker
 */
export interface CacheWriteResponse {
	queued: boolean;
	reason?: string;
}

/**
 * Snapshot precompute job for dashboard snapshot materialization
 */
export interface SnapshotPrecomputeJob {
	user_id?: string;
	widgets: Array<{
		id: string;
		type: string;
		visible?: boolean;
		container_id?: string;
	}>;
	priority?: 'low' | 'normal' | 'high';
}

/**
 * Snapshot precompute request for Go worker
 */
export interface SnapshotPrecomputeRequest {
	job: SnapshotPrecomputeJob;
}

/**
 * Snapshot precompute response from Go worker
 */
export interface SnapshotPrecomputeResponse {
	queued: boolean;
	job_id?: string;
	reason?: string;
}

/**
 * Health check response from Go worker
 */
export interface WorkerHealthResponse {
	status: 'ok';
	version: string;
	uptime_ms: number;
}

/**
 * Readiness check response from Go worker
 */
export interface WorkerReadyResponse {
	status: 'ready' | 'not_ready';
}
