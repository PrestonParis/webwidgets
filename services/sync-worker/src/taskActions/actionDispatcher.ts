import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkerEnv } from '../env.js';
import type { RuntimeLogger } from '../logger.js';
import { WorkerTaskError, type TaskProcessor } from '../v1/processors.js';
import { createTaskActionProcessor } from './taskActionProcessor.js';
import { executeProviderAction } from './providerActionProcessor.js';

export function createActionDispatcher(
    client: SupabaseClient,
    env: WorkerEnv,
    logger: RuntimeLogger,
): TaskProcessor {
    const tasks = createTaskActionProcessor(client, logger);
    return async (context) => {
        const { envelope, dryRun } = context;
        if (envelope.task.kind !== 'action.execute')
            throw new WorkerTaskError(
                'action_invalid',
                'Invalid action task.',
                false,
            );
        const lookup = await client
            .from('action_requests')
            .select('action_id')
            .eq('id', envelope.task.actionRequestId)
            .eq('user_id', envelope.userId)
            .single();
        const action = z
            .object({ action_id: z.string() })
            .safeParse(lookup.data);
        if (lookup.error || !action.success)
            throw new WorkerTaskError(
                'action_lookup_failed',
                'Action could not be loaded.',
                true,
            );
        const allowed = await client.rpc('assert_v1_automation_execution', {
            p_action_request_id: envelope.task.actionRequestId,
        });
        if (allowed.error)
            throw new WorkerTaskError(
                'automation_guard_failed',
                'Automation safety controls could not be verified.',
                true,
            );
        if (allowed.data !== true)
            throw new WorkerTaskError(
                'automation_paused',
                'Automation execution was cancelled by a pause control.',
                false,
            );
        const kind = ['email.draft', 'email.send'].includes(
            action.data.action_id,
        )
            ? 'email'
            : action.data.action_id === 'calendar.create_event'
              ? 'calendar'
              : action.data.action_id === 'automation.run'
                ? 'workflow'
                : null;
        if (!kind) return tasks(context);
        if (dryRun)
            throw new WorkerTaskError(
                `${kind}_dry_run`,
                'Provider writes are disabled in dry-run mode.',
                false,
            );
        return executeProviderAction(env, envelope, kind);
    };
}
