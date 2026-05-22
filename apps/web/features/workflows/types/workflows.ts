import type { Json } from '@/types/supabase';
import type { WorkflowKey } from '@/lib/n8n/n8nSchemas';
import type { N8nTriggerResult } from '@/lib/n8n/n8nTypes';

export type WorkflowTriggerStatus = 'queued' | 'started' | 'failed';

export type WorkflowTriggerInput<TPayload extends Json = Json> = {
    workflowKey: WorkflowKey;
    userId: string;
    payload: TPayload;
    idempotencyKey?: string;
};

export type WorkflowTriggerResult = {
    status: WorkflowTriggerStatus;
    workflowKey: WorkflowKey;
    jobId?: string;
    runId?: string;
    error?: N8nTriggerResult['error'];
};
