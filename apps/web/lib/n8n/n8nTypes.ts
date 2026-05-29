import type { z } from 'zod';
import type {
    n8nTriggerResultSchema,
    n8nWebhookEventSchema,
} from '@/lib/n8n/n8nSchemas';

export type TriggerN8nWorkflowInput<TPayload> = {
    workflowKey: string;
    webhookPath: string;
    payload: TPayload;
    idempotencyKey?: string;
};

export type N8nTriggerResult = z.infer<typeof n8nTriggerResultSchema>;
export type N8nWebhookEvent = z.infer<typeof n8nWebhookEventSchema>;

export type N8nClientConfig = {
    baseUrl?: string;
    apiKey?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
};
