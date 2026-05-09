import {
    Registry,
    Counter,
    Histogram,
    Gauge,
    collectDefaultMetrics,
} from 'prom-client';

export const registry = new Registry();

collectDefaultMetrics({ register: registry, prefix: 'dashboard_node_' });

// ─── HTTP ────────────────────────────────────────────────────────────────────

export const httpRequestsTotal = new Counter({
    name: 'dashboard_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [registry],
});

export const httpRequestDuration = new Histogram({
    name: 'dashboard_http_request_duration_seconds',
    help: 'HTTP request latency in seconds',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry],
});

// ─── Email queue ─────────────────────────────────────────────────────────────

export const emailQueueDepth = new Gauge({
    name: 'dashboard_email_queue_depth',
    help: 'Number of pending items in the email queue',
    registers: [registry],
});

export const emailQueueProcessed = new Counter({
    name: 'dashboard_email_queue_processed_total',
    help: 'Email queue items processed',
    labelNames: ['status'] as const,
    registers: [registry],
});

export const emailQueueRetries = new Counter({
    name: 'dashboard_email_queue_retries_total',
    help: 'Email queue retry attempts',
    registers: [registry],
});

export const emailQueueDeadLettered = new Counter({
    name: 'dashboard_email_queue_dead_lettered_total',
    help: 'Email queue items moved to dead-letter',
    registers: [registry],
});

// ─── External API calls ───────────────────────────────────────────────────────

export const externalApiDuration = new Histogram({
    name: 'dashboard_external_api_duration_seconds',
    help: 'Duration of external API calls',
    labelNames: ['service', 'operation', 'status'] as const,
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [registry],
});

export const externalApiErrors = new Counter({
    name: 'dashboard_external_api_errors_total',
    help: 'External API call failures',
    labelNames: ['service', 'operation'] as const,
    registers: [registry],
});

// ─── ML inference ────────────────────────────────────────────────────────────

export const mlInferenceDuration = new Histogram({
    name: 'dashboard_ml_inference_duration_seconds',
    help: 'Duration of model inference by stage',
    labelNames: ['stage'] as const,
    buckets: [0.005, 0.01, 0.05, 0.1, 0.5, 1, 2.5, 5],
    registers: [registry],
});

export const mlInferenceTotal = new Counter({
    name: 'dashboard_ml_inference_total',
    help: 'Number of inference calls by stage and outcome',
    labelNames: ['stage', 'outcome'] as const,
    registers: [registry],
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authFailures = new Counter({
    name: 'dashboard_auth_failures_total',
    help: 'Authentication failures by reason',
    labelNames: ['reason'] as const,
    registers: [registry],
});
