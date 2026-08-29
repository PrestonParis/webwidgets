import type { SupabaseClient } from '@supabase/supabase-js';
import { enqueueTaskAction } from '@/lib/taskActions/workerClient';
import { V1_SUGGESTION_ID } from './fixture';

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
}

interface DeliverableRow {
    id: string;
    user_id: string;
    name: string;
    source_widgets: string[];
    output_type: string;
    schedule: Record<string, unknown>;
    delivery_destination: string;
    approval_mode: string;
    enabled: boolean;
}

async function createFixture(db: SupabaseClient): Promise<unknown> {
    const result = await db.rpc('create_v1_task_automation', {
        p_name: 'Daily priority task',
        p_title: 'Review today’s WebWidgets priorities',
        p_notes: 'Created only after approval in the Automation Center.',
        p_schedule_time: '09:00',
        p_timezone: 'UTC',
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
    input: CommandInput,
): Promise<unknown> {
    const result = await db.rpc('trigger_v1_task_automation', {
        p_config_id: input.id,
        p_trigger_key: `manual:${crypto.randomUUID()}`,
        p_dry_run: input.dryRun ?? false,
    });
    if (result.error) throw result.error;
    return result.data as unknown;
}

export async function executeAutomationCommand(
    db: SupabaseClient,
    userId: string,
    input: CommandInput,
): Promise<unknown> {
    if (input.command === 'create_fixture') return createFixture(db);
    if (input.command === 'set_state') return setState(db, userId, input);
    if (input.command === 'trigger') return trigger(db, input);
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
        if (input.id !== V1_SUGGESTION_ID)
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
        const values = {
            user_id: userId,
            name: input.name,
            source_widgets: input.sourceWidgets,
            output_type: input.outputType,
            schedule: input.schedule,
            delivery_destination: input.deliveryDestination,
            approval_mode: input.approvalMode,
            enabled: input.enabled,
            updated_at: new Date().toISOString(),
        };
        const query = input.id
            ? db
                  .from('automation_deliverables')
                  .update(values)
                  .eq('id', input.id)
                  .eq('user_id', userId)
            : db.from('automation_deliverables').insert(values);
        const result = await query.select('*').single();
        if (result.error) throw result.error;
        const row = result.data as unknown as DeliverableRow;
        return {
            id: row.id,
            userId: row.user_id,
            name: row.name,
            sourceWidgets: row.source_widgets,
            outputType: row.output_type,
            schedule: row.schedule,
            deliveryDestination: row.delivery_destination,
            approvalMode: row.approval_mode,
            enabled: row.enabled,
        };
    }
    throw new Error('automation_command_invalid');
}
