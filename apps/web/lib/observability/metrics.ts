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

// ─── Unified Action Engine ───────────────────────────────────────────────────

export const actionExecutionsTotal = new Counter({
    name: 'dashboard_action_executions_total',
    help: 'Unified action engine executions by action and status',
    labelNames: ['action_id', 'status'] as const,
    registers: [registry],
});

export const actionExecutionDuration = new Histogram({
    name: 'dashboard_action_execution_duration_seconds',
    help: 'Unified action engine execution duration in seconds',
    labelNames: ['action_id', 'status'] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry],
});

export const actionQueueLatency = new Histogram({
    name: 'dashboard_action_queue_latency_seconds',
    help: 'Unified action queue latency before worker execution',
    labelNames: ['action_id'] as const,
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5, 15, 60],
    registers: [registry],
});

// ─── Durable V1 operations ──────────────────────────────────────────────────

export const v1WorkerHealthy = new Gauge({
    name: 'dashboard_v1_worker_healthy',
    help: 'Whether a dependency-ready worker heartbeat was seen within 90 seconds',
    registers: [registry],
});

export const v1QueueDepth = new Gauge({
    name: 'dashboard_v1_queue_depth',
    help: 'Canonical V1 jobs waiting to run',
    registers: [registry],
});

export const v1OldestQueueAge = new Gauge({
    name: 'dashboard_v1_oldest_queue_age_seconds',
    help: 'Age of the oldest canonical V1 job waiting to run',
    registers: [registry],
});

export const v1DeadLetters = new Gauge({
    name: 'dashboard_v1_dead_letters_24h',
    help: 'Canonical V1 jobs dead-lettered in the last 24 hours',
    registers: [registry],
});

export const v1OverdueSources = new Gauge({
    name: 'dashboard_v1_overdue_sources',
    help: 'Enabled integrations overdue for synchronization by 15 minutes',
    registers: [registry],
});

export const v1BriefingFailures = new Gauge({
    name: 'dashboard_v1_briefing_failures_24h',
    help: 'Briefing failures in the last 24 hours',
    registers: [registry],
});

export const v1ActionFailures = new Gauge({
    name: 'dashboard_v1_action_failed_or_unknown_24h',
    help: 'Failed or unknown action outcomes in the last 24 hours',
    registers: [registry],
});

export const v1AutomationFailures = new Gauge({
    name: 'dashboard_v1_automation_failures_24h',
    help: 'Automation failures or dead letters in the last 24 hours',
    registers: [registry],
});

export const v1PersistedTimelineDuplicates = new Gauge({
    name: 'dashboard_v1_persisted_timeline_duplicate_groups',
    help: 'Persisted timeline idempotency-key groups with more than one row',
    registers: [registry],
});

export const v1InferenceFailures = new Gauge({
    name: 'dashboard_v1_inference_failures_24h',
    help: 'Bounded inference failures in the last 24 hours',
    registers: [registry],
});

export const v1InferenceCost = new Gauge({
    name: 'dashboard_v1_inference_estimated_cost_usd_24h',
    help: 'Estimated bounded inference cost in USD in the last 24 hours',
    registers: [registry],
});

export const v1NegativeBriefingFeedback = new Gauge({
    name: 'dashboard_v1_briefing_negative_feedback_24h',
    help: 'Not useful or incorrect briefing ratings in the last 24 hours',
    registers: [registry],
});

export const v1CandidateDismissals = new Gauge({
    name: 'dashboard_v1_candidate_dismissals_24h',
    help: 'Candidate actions dismissed in the last 24 hours',
    registers: [registry],
});

export const v1ActionSuccesses = new Gauge({
    name: 'dashboard_v1_action_successes_24h',
    help: 'Verified action successes in the last 24 hours',
    registers: [registry],
});

export const v1ActionReplayAttempts = new Gauge({
    name: 'dashboard_v1_action_replay_attempts_24h',
    help: 'Action result attempts above the first attempt in the last 24 hours',
    registers: [registry],
});

export const v1PausedAutomationUsers = new Gauge({
    name: 'dashboard_v1_automation_users_paused',
    help: 'Users with the global automation pause enabled',
    registers: [registry],
});

function recordOf(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
}

function numberOf(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function setV1OperationalMetrics(snapshot: unknown) {
    const root = recordOf(snapshot);
    const worker = recordOf(root['worker']);
    const jobs = recordOf(root['jobs']);
    const sources = recordOf(root['sources']);
    const timeline = recordOf(root['timeline']);
    const inference = recordOf(root['inference']);
    const briefings = recordOf(root['briefings']);
    const candidates = recordOf(root['candidates']);
    const actions = recordOf(root['actions']);
    const automations = recordOf(root['automations']);
    v1WorkerHealthy.set(worker['healthy'] === true ? 1 : 0);
    v1QueueDepth.set(numberOf(jobs['queue_depth']));
    v1OldestQueueAge.set(numberOf(jobs['oldest_queue_age_seconds']));
    v1DeadLetters.set(numberOf(jobs['dead_letters_24h']));
    v1OverdueSources.set(numberOf(sources['overdue']));
    v1BriefingFailures.set(numberOf(briefings['failures_24h']));
    v1ActionFailures.set(numberOf(actions['failed_or_unknown_24h']));
    v1AutomationFailures.set(numberOf(automations['failures_24h']));
    v1PersistedTimelineDuplicates.set(
        numberOf(timeline['persisted_duplicate_groups']),
    );
    v1InferenceFailures.set(numberOf(inference['failures_24h']));
    v1InferenceCost.set(numberOf(inference['estimated_cost_usd_24h']));
    v1NegativeBriefingFeedback.set(
        numberOf(briefings['negative_feedback_24h']),
    );
    v1CandidateDismissals.set(numberOf(candidates['dismissed_24h']));
    v1ActionSuccesses.set(numberOf(actions['succeeded_24h']));
    v1ActionReplayAttempts.set(numberOf(actions['replay_attempts_24h']));
    v1PausedAutomationUsers.set(numberOf(automations['users_paused']));
}
