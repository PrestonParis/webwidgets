import type { SupabaseClient } from '@supabase/supabase-js';
import type { z } from 'zod';
import type { Json } from '@/types/supabase';
import {
    createJob,
    updateJobStatus,
} from '@/features/jobs/services/jobService';
import { triggerN8nWorkflow } from '@/lib/n8n/n8nClient';
import {
    n8nWebhookEventSchema,
    workflowPayloadSchemas,
    type WorkflowKey,
} from '@/lib/n8n/n8nSchemas';
import type { N8nWebhookEvent } from '@/lib/n8n/n8nTypes';
import type {
    WorkflowTriggerInput,
    WorkflowTriggerResult,
} from '@/features/workflows/types/workflows';

const workflowWebhookPaths = {
    email_ingestion: '/webhook/webwidgets/email-ingestion',
    calendar_sync: '/webhook/webwidgets/calendar-sync',
    finance_sync: '/webhook/webwidgets/finance-sync',
    research_item_processing: '/webhook/webwidgets/research-item-processing',
    ml_enrichment: '/webhook/webwidgets/ml-enrichment',
    weekly_summary: '/webhook/webwidgets/weekly-summary',
    recovery_check_in_analysis:
        '/webhook/webwidgets/recovery-check-in-analysis',
} satisfies Record<WorkflowKey, string>;

const workflowJobTypes = {
    email_ingestion: 'email_action_extraction',
    calendar_sync: 'automation_run',
    finance_sync: 'finance_categorization',
    research_item_processing: 'research_task',
    ml_enrichment: 'automation_run',
    weekly_summary: 'automation_run',
    recovery_check_in_analysis: 'tracking_insight_generation',
} as const satisfies Record<WorkflowKey, Parameters<typeof createJob>[2]>;

function eventUserId(event: N8nWebhookEvent): string | undefined {
    return event.payload.userId;
}

export async function triggerWorkflow<TPayload extends Json>(
    supabase: SupabaseClient,
    input: WorkflowTriggerInput<TPayload>,
): Promise<WorkflowTriggerResult> {
    const schema = workflowPayloadSchemas[input.workflowKey];
    const payload = schema.parse({
        ...(input.payload as Record<string, unknown>),
        userId: input.userId,
    }) as unknown as TPayload;
    const job = await createJob(
        supabase,
        input.userId,
        workflowJobTypes[input.workflowKey],
        {
            workflowKey: input.workflowKey,
            payload,
            idempotencyKey: input.idempotencyKey ?? crypto.randomUUID(),
        } as Json,
    );

    const result = await triggerN8nWorkflow(
        {
            workflowKey: input.workflowKey,
            webhookPath: workflowWebhookPaths[input.workflowKey],
            payload,
            idempotencyKey: input.idempotencyKey ?? job.id,
        },
        schema as unknown as z.ZodType<TPayload>,
    );

    if (!result.ok) {
        await updateJobStatus(
            supabase,
            input.userId,
            job.id,
            'failed',
            result.error?.message,
        );
        return {
            status: 'failed',
            workflowKey: input.workflowKey,
            jobId: job.id,
            error: result.error,
        };
    }

    await updateJobStatus(supabase, input.userId, job.id, 'running');
    return {
        status: 'started',
        workflowKey: input.workflowKey,
        jobId: job.id,
        ...(result.runId ? { runId: result.runId } : {}),
    };
}

export async function handleN8nWebhookEvent(
    supabase: SupabaseClient,
    eventInput: unknown,
): Promise<{ ok: true; eventType: N8nWebhookEvent['type']; jobId?: string }> {
    const event = n8nWebhookEventSchema.parse(eventInput);
    const userId = eventUserId(event);

    if (!userId) return { ok: true, eventType: event.type };

    const jobType = (() => {
        switch (event.type) {
            case 'email.ingested':
                return 'email_action_extraction';
            case 'calendar.synced':
                return 'automation_run';
            case 'finance.synced':
                return 'finance_categorization';
            case 'research.item_processed':
                return 'research_task';
            case 'ml.enrichment_completed':
                return 'automation_run';
        }
    })();

    const job = await createJob(supabase, userId, jobType, {
        source: 'n8n',
        event,
        idempotencyKey: event.payload.idempotencyKey,
    } as Json);
    await updateJobStatus(supabase, userId, job.id, 'completed');
    return { ok: true, eventType: event.type, jobId: job.id };
}
