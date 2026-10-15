import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RuntimeLogger } from '../logger.js';
import { WorkerTaskError, type TaskProcessor } from '../v1/processors.js';

const outputSchema = z.object({
    taskId: z.string().uuid(),
    title: z.string(),
    notes: z.string().nullable(),
    dueAt: z.string().nullable(),
    completed: z.boolean(),
    completedAt: z.string().nullable(),
    verifiedUpdatedAt: z.string(),
});

function executionError(message: string) {
    const conflict =
        /stale|expired|forbidden|unsupported|conflict|mismatch/.test(message);
    return new WorkerTaskError(
        conflict ? 'task_action_conflict' : 'task_action_execution_failed',
        conflict
            ? 'Task execution was blocked by authorization, approval, or concurrent-edit checks.'
            : 'Task execution could not be verified and will be retried.',
        !conflict,
    );
}

export function createTaskActionProcessor(
    client: SupabaseClient,
    logger: RuntimeLogger,
): TaskProcessor {
    return async ({ envelope, dryRun }) => {
        if (envelope.task.kind !== 'action.execute') {
            throw new WorkerTaskError(
                'task_action_payload_invalid',
                'Task action payload is invalid.',
                false,
            );
        }
        if (dryRun) {
            throw new WorkerTaskError(
                'task_action_dry_run',
                'Task mutation is disabled while the worker is in dry-run mode.',
                false,
            );
        }
        const running = await client
            .from('action_requests')
            .update({
                status: 'running',
                execution_started_at: new Date().toISOString(),
            })
            .eq('id', envelope.task.actionRequestId)
            .eq('user_id', envelope.userId)
            .eq('approval_state', 'approved')
            .neq('status', 'completed')
            .select('id')
            .maybeSingle();
        if (running.error) throw executionError(running.error.message);
        const result = await client.rpc('execute_approved_task_action', {
            p_action_request_id: envelope.task.actionRequestId,
            p_job_id: envelope.jobId,
            p_attempt: 1,
        });
        if (result.error) throw executionError(result.error.message);
        const output = outputSchema.safeParse(result.data);
        if (!output.success) {
            throw new WorkerTaskError(
                'task_action_verification_failed',
                'Task execution returned an invalid verification receipt.',
                true,
            );
        }
        logger.info('task action verified', {
            actionRequestId: envelope.task.actionRequestId,
            jobId: envelope.jobId,
            taskId: output.data.taskId,
        });
        return output.data;
    };
}
