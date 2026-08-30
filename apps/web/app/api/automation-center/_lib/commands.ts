import type { SupabaseClient } from '@supabase/supabase-js';
import { enqueueTaskAction } from '@/lib/taskActions/workerClient';
import { enqueueBriefingJob } from '@/lib/briefings/workerClient';
import { createLegacyTaskFixture, V1_SUGGESTION_ID } from './fixture';
import { upsertDeliverable } from './deliverableCommand';
import {
    V1_TEMPLATE_IDS,
    v1TemplateDefinition,
} from '@/features/automation/lib/v1TemplateCatalog';

interface CommandInput {
    command: string;
    id?: string | undefined;
    enabled?: boolean | undefined;
    decision?: 'approved' | 'denied' | undefined;
    payloadVersion?: number | undefined;
    payloadHash?: string | undefined;
    dryRun?: boolean | undefined;
    name?: string | undefined;
    sourceWidgets?: string[] | undefined;
    outputType?: string | undefined;
    schedule?: Record<string, unknown> | undefined;
    deliveryDestination?: string | undefined;
    approvalMode?: string | undefined;
    definitionId?: string | undefined;
    localTime?: string | undefined;
    timezone?: string | undefined;
}

async function createTemplate(
    db: SupabaseClient,
    input: CommandInput,
): Promise<unknown> {
    const definition = v1TemplateDefinition(input.definitionId ?? '');
    if (!definition) throw new Error('automation_template_unsupported');
    const result = await db.rpc('create_v1_automation_template', {
        p_definition_id: definition.id,
        p_local_time: input.localTime ?? definition.schedule?.time ?? '09:00',
        p_timezone: input.timezone ?? 'UTC',
        p_approval_mode: definition.approvalPolicy.required
            ? 'always'
            : 'never',
        p_dry_run: input.dryRun ?? true,
    });
    if (result.error) throw result.error;
    return result.data as unknown;
}

async function setState(
    db: SupabaseClient,
    userId: string,
    input: CommandInput,
): Promise<unknown> {
    const state = input.enabled ? 'enabled' : 'paused';
    const result = await db
        .from('automation_configs')
        .update({ state, updated_at: new Date().toISOString() })
        .eq('id', input.id)
        .eq('user_id', userId)
        .is('archived_at', null)
        .select('id')
        .single();
    if (result.error) throw result.error;
    if (state !== 'enabled') {
        await db
            .from('automation_runs')
            .update({
                approval_state: 'invalidated',
                status: 'cancelled',
                completed_at: new Date().toISOString(),
            })
            .eq('automation_config_id', input.id)
            .eq('user_id', userId)
            .in('status', ['awaiting_approval', 'waiting_for_approval']);
    }
    return result.data as unknown;
}

async function decide(
    db: SupabaseClient,
    userId: string,
    input: CommandInput,
): Promise<unknown> {
    const result = await db.rpc('decide_v1_automation_run', {
        p_run_id: input.id,
        p_expected_version: input.payloadVersion,
        p_expected_hash: input.payloadHash,
        p_decision: input.decision,
    });
    if (result.error || !result.data)
        throw result.error ?? new Error('automation_decision_failed');
    const request = result.data as {
        id: string;
        idempotency_key: string;
        approval_state: string;
    };
    if (request.approval_state !== input.decision)
        throw new Error('automation_decision_rejected');
    if (input.decision === 'approved') {
        await enqueueTaskAction({
            userId,
            actionRequestId: request.id,
            idempotencyKey: `execute:${request.id}`,
        });
    }
    return { runId: input.id, decision: input.decision };
}

async function trigger(
    db: SupabaseClient,
    userId: string,
    input: CommandInput,
): Promise<unknown> {
    const config = await db
        .from('automation_configs')
        .select('definition_id')
        .eq('id', input.id)
        .eq('user_id', userId)
        .single();
    if (config.error) throw config.error;
    const definitionId = String(config.data.definition_id);
    const isTemplate = V1_TEMPLATE_IDS.includes(
        definitionId as (typeof V1_TEMPLATE_IDS)[number],
    );
    const triggerKey = `manual:${crypto.randomUUID()}`;
    const result = await db.rpc(
        isTemplate
            ? 'trigger_v1_automation_template'
            : 'trigger_v1_task_automation',
        isTemplate
            ? {
                  p_config_id: input.id,
                  p_trigger_key: triggerKey,
                  p_trigger_payload: {},
                  p_dry_run: input.dryRun ?? false,
              }
            : {
                  p_config_id: input.id,
                  p_trigger_key: triggerKey,
                  p_dry_run: input.dryRun ?? false,
              },
    );
    if (result.error) throw result.error;
    const run = result.data as {
        id: string;
        status: string;
        action_payload?: Record<string, unknown>;
    };
    if (definitionId === 'v1.daily-briefing' && run.status === 'queued') {
        const payload = run.action_payload ?? {};
        const job = await enqueueBriefingJob({
            userId,
            trigger: 'daily',
            coveredFrom: String(payload['coveredFrom']),
            coveredTo: String(payload['coveredTo']),
            idempotencyKey: `automation-briefing:${input.id}:${triggerKey}`,
        });
        const linked = await db
            .from('automation_runs')
            .update({ job_id: job.jobId })
            .eq('id', run.id)
            .eq('user_id', userId);
        if (linked.error) throw linked.error;
    }
    return result.data as unknown;
}

async function configure(
    db: SupabaseClient,
    userId: string,
    input: CommandInput,
) {
    const current = await db
        .from('automation_configs')
        .select('definition_id,config')
        .eq('id', input.id)
        .eq('user_id', userId)
        .single();
    if (current.error) throw current.error;
    const definition = v1TemplateDefinition(String(current.data.definition_id));
    if (!definition) throw new Error('automation_template_unsupported');
    const timezone = input.timezone ?? 'UTC';
    try {
        new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
    } catch {
        throw new Error('automation_timezone_invalid');
    }
    const localTime = input.localTime ?? definition.schedule?.time ?? '09:00';
    const approvalMode = definition.approvalPolicy.required
        ? 'always'
        : 'never';
    const existing = current.data.config as Record<string, unknown>;
    const result = await db
        .from('automation_configs')
        .update({
            approval_mode: approvalMode,
            schedule: definition.schedule ? localTime : null,
            state: input.dryRun ? 'dry_run' : 'paused',
            next_run_at: null,
            config: {
                ...existing,
                schedule: {
                    localTime,
                    timezone,
                    frequency:
                        definition.id === 'v1.stale-task-review'
                            ? 'weekly'
                            : 'daily',
                },
            },
            updated_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('user_id', userId)
        .select('id')
        .single();
    if (result.error) throw result.error;
    return result.data;
}

export async function executeAutomationCommand(
    db: SupabaseClient,
    userId: string,
    input: CommandInput,
): Promise<unknown> {
    if (input.command === 'create_fixture') return createLegacyTaskFixture(db);
    if (input.command === 'create_template') return createTemplate(db, input);
    if (input.command === 'configure') return configure(db, userId, input);
    if (input.command === 'set_state') return setState(db, userId, input);
    if (input.command === 'trigger') return trigger(db, userId, input);
    if (input.command === 'decide') return decide(db, userId, input);
    if (input.command === 'pause_all') {
        const result = await db
            .from('automation_user_controls')
            .upsert(
                {
                    user_id: userId,
                    pause_all: !input.enabled,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: 'user_id' },
            )
            .select()
            .single();
        if (result.error) throw result.error;
        return { enabled: input.enabled };
    }
    if (input.command === 'archive') {
        const result = await db
            .from('automation_configs')
            .update({
                state: 'disabled',
                archived_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', input.id)
            .eq('user_id', userId)
            .select('id')
            .single();
        if (result.error) throw result.error;
        return { archived: true };
    }
    if (input.command === 'dismiss') {
        if (
            input.id !== V1_SUGGESTION_ID &&
            !input.id?.startsWith('suggestion:')
        )
            throw new Error('automation_suggestion_invalid');
        const result = await db
            .from('automation_suggestion_dismissals')
            .upsert({
                user_id: userId,
                suggestion_id: input.id,
            });
        if (result.error) throw result.error;
        return { dismissed: true };
    }
    if (input.command === 'retry') {
        const request = await db
            .from('action_requests')
            .select('id')
            .eq('automation_run_id', input.id)
            .eq('user_id', userId)
            .eq('approval_state', 'approved')
            .single();
        if (request.error) throw request.error;
        const row = request.data as unknown as { id: string };
        return enqueueTaskAction({
            userId,
            actionRequestId: row.id,
            idempotencyKey: `execute:${row.id}`,
        });
    }
    if (input.command === 'upsert_deliverable') {
        return upsertDeliverable(db, userId, input);
    }
    throw new Error('automation_command_invalid');
}
