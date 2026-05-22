import { captureError } from '@/lib/observability/sentry';
import { N8nError, toN8nError } from '@/lib/n8n/n8nErrors';
import { n8nEnvSchema, n8nTriggerResponseSchema } from '@/lib/n8n/n8nSchemas';
import type {
    N8nClientConfig,
    N8nTriggerResult,
    TriggerN8nWorkflowInput,
} from '@/lib/n8n/n8nTypes';
import type { z } from 'zod';

function joinUrl(baseUrl: string, webhookPath: string) {
    const base = baseUrl.replace(/\/+$/, '');
    const path = webhookPath.replace(/^\/+/, '');
    return `${base}/${path}`;
}

function runIdFrom(json: unknown): string | undefined {
    const parsed = n8nTriggerResponseSchema.safeParse(json);
    if (!parsed.success) return undefined;
    return parsed.data.runId ?? parsed.data.executionId ?? parsed.data.id;
}

export async function triggerN8nWorkflow<TPayload>(
    input: TriggerN8nWorkflowInput<TPayload>,
    schema: z.ZodType<TPayload>,
    config: N8nClientConfig = {},
): Promise<N8nTriggerResult> {
    const startedAt = performance.now();
    const env = n8nEnvSchema.parse(process.env);
    const baseUrl = config.baseUrl ?? env.N8N_BASE_URL;
    const apiKey = config.apiKey ?? env.N8N_API_KEY;
    const timeoutMs = config.timeoutMs ?? env.N8N_TIMEOUT_MS;
    const fetchImpl = config.fetchImpl ?? fetch;

    try {
        if (!baseUrl || !apiKey) {
            throw new N8nError(
                'N8N_NOT_CONFIGURED',
                'Workflow service is not configured.',
            );
        }

        const payload = schema.parse(input.payload);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        let response: Response;
        try {
            response = await fetchImpl(joinUrl(baseUrl, input.webhookPath), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                    ...(input.idempotencyKey
                        ? { 'Idempotency-Key': input.idempotencyKey }
                        : {}),
                },
                body: JSON.stringify({
                    workflowKey: input.workflowKey,
                    payload,
                    ...(input.idempotencyKey
                        ? { idempotencyKey: input.idempotencyKey }
                        : {}),
                }),
                signal: controller.signal,
            });
        } finally {
            clearTimeout(timeout);
        }

        if (response.status === 401 || response.status === 403) {
            throw new N8nError(
                'N8N_UNAUTHORIZED',
                'Workflow service rejected authorization.',
                response.status,
            );
        }
        if (!response.ok) {
            throw new N8nError(
                'N8N_BAD_RESPONSE',
                'Workflow service returned an error.',
                response.status,
            );
        }

        const json: unknown = await response.json().catch(() => ({}));
        return {
            ok: true,
            workflowKey: input.workflowKey,
            ...(runIdFrom(json) ? { runId: runIdFrom(json) } : {}),
        };
    } catch (err) {
        const normalized = toN8nError(err);
        captureError(err, {
            operation: 'triggerN8nWorkflow',
            feature: 'workflows',
            tags: {
                workflowKey: input.workflowKey,
                webhookPath: input.webhookPath,
            },
            extra: {
                durationMs: Math.round(performance.now() - startedAt),
                statusCode:
                    err instanceof N8nError ? err.statusCode : undefined,
            },
        });
        return {
            ok: false,
            workflowKey: input.workflowKey,
            error: normalized,
        };
    }
}
