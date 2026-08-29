import type { SupabaseClient } from '@supabase/supabase-js';
import { V1_SUGGESTION_ID, V1_TASK_DEFINITION } from './fixture';

interface ConfigRow {
    id: string;
    user_id: string;
    name: string;
    definition_id: string | null;
    state: string;
    config: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    last_triggered_at: string | null;
    next_run_at: string | null;
}

interface RunRow {
    id: string;
    user_id: string;
    automation_config_id: string | null;
    status: string;
    approval_state: string | null;
    action_payload: Record<string, unknown>;
    action_payload_hash: string | null;
    action_payload_version: number;
    evaluation: Record<string, unknown>;
    trigger_payload: Record<string, unknown>;
    started_at: string | null;
    completed_at: string | null;
    created_at: string;
    failure_detail: string | null;
}

interface RequestRow {
    automation_run_id: string;
    payload: Record<string, unknown>;
    requested_at: string;
    payload_version: number;
    payload_hash: string;
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
    last_generated_at: string | null;
    next_generated_at: string | null;
}

function textValue(value: unknown, fallback = '') {
    return typeof value === 'string' ? value : fallback;
}

function centerStatus(state: string) {
    if (state === 'enabled') return 'enabled';
    if (state === 'paused') return 'paused';
    if (state === 'draft' || state === 'dry_run') return 'draft';
    if (state === 'requires_connection') return 'provider_missing';
    if (state === 'requires_consent') return 'needs_setup';
    return 'paused';
}

function runStatus(status: string) {
    if (status === 'awaiting_approval') return 'waiting_for_approval';
    if (status === 'triggered' || status === 'evaluating') return 'running';
    if (status === 'partially_failed' || status === 'dead_lettered')
        return 'failed';
    return status;
}

export async function loadAutomationCenter(db: SupabaseClient, userId: string) {
    const [
        configsResult,
        runsResult,
        requestsResult,
        controlResult,
        dismissalsResult,
        deliverablesResult,
    ] = await Promise.all([
        db
            .from('automation_configs')
            .select('*')
            .eq('user_id', userId)
            .is('archived_at', null)
            .order('created_at', { ascending: false }),
        db
            .from('automation_runs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(100),
        db
            .from('action_requests')
            .select('*')
            .eq('user_id', userId)
            .eq('approval_state', 'required')
            .eq('status', 'pending')
            .not('automation_run_id', 'is', null)
            .order('requested_at'),
        db
            .from('automation_user_controls')
            .select('pause_all')
            .eq('user_id', userId)
            .maybeSingle(),
        db
            .from('automation_suggestion_dismissals')
            .select('suggestion_id')
            .eq('user_id', userId),
        db
            .from('automation_deliverables')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false }),
    ]);
    const error = [
        configsResult,
        runsResult,
        requestsResult,
        controlResult,
        dismissalsResult,
        deliverablesResult,
    ].find((result) => result.error)?.error;
    if (error) throw error;
    const configs = (configsResult.data ?? []) as ConfigRow[];
    const names = new Map(configs.map((config) => [config.id, config.name]));
    const runs = (runsResult.data ?? []) as RunRow[];
    const runMap = new Map(runs.map((run) => [run.id, run]));
    const instances = configs.map((config) => ({
        id: config.id,
        userId: config.user_id,
        definitionId: config.definition_id ?? V1_TASK_DEFINITION.id,
        definition: { ...V1_TASK_DEFINITION, name: config.name },
        status: centerStatus(config.state),
        enabled: config.state === 'enabled',
        ...(config.last_triggered_at && {
            lastRunAt: config.last_triggered_at,
        }),
        ...(config.next_run_at && { nextRunAt: config.next_run_at }),
        approvalRequired: true,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
    }));
    const history = runs.map((run) => ({
        id: run.id,
        userId: run.user_id,
        instanceId: run.automation_config_id ?? '',
        automationName:
            names.get(run.automation_config_id ?? '') ?? 'Archived automation',
        widgetName: 'Tasks',
        status: runStatus(run.status),
        triggeredBy: textValue(run.trigger_payload['type'], 'manual'),
        startedAt: run.started_at ?? run.created_at,
        ...(run.completed_at && { completedAt: run.completed_at }),
        ...(run.failure_detail && { errorMessage: run.failure_detail }),
        approvalStatus:
            run.approval_state === 'denied' ? 'rejected' : run.approval_state,
        triggerInput: run.trigger_payload,
        actionsAttempted: ['create_task'],
        summary: textValue(run.evaluation['reason'], run.status).replaceAll(
            '_',
            ' ',
        ),
    }));
    const requests = (requestsResult.data ?? []) as RequestRow[];
    const approvals = requests.map((request) => {
        const run = runMap.get(request.automation_run_id);
        const payload = request.payload;
        return {
            id: request.automation_run_id,
            runId: request.automation_run_id,
            automationName:
                names.get(run?.automation_config_id ?? '') ?? 'Task automation',
            proposedAction: `Create task: ${textValue(payload['title'], 'Untitled')}`,
            outputPreview: textValue(payload['notes']),
            createdAt: request.requested_at,
            widgetName: 'Tasks',
            payloadVersion: Number(request.payload_version),
            payloadHash: request.payload_hash,
        };
    });
    const dismissals = (dismissalsResult.data ?? []) as {
        suggestion_id: string;
    }[];
    const dismissed = new Set(dismissals.map((row) => row.suggestion_id));
    const deliverables = (deliverablesResult.data ?? []) as DeliverableRow[];
    const alreadyConfigured = configs.some(
        (config) => config.definition_id === V1_TASK_DEFINITION.id,
    );
    return {
        globalEnabled: controlResult.data?.pause_all !== true,
        instances,
        runs: history,
        approvals,
        deliverables: deliverables.map((item) => ({
            id: item.id,
            userId: item.user_id,
            name: item.name,
            sourceWidgets: item.source_widgets,
            outputType: item.output_type,
            schedule: item.schedule,
            deliveryDestination: item.delivery_destination,
            approvalMode: item.approval_mode,
            enabled: item.enabled,
            ...(item.last_generated_at && {
                lastGeneratedAt: item.last_generated_at,
            }),
            ...(item.next_generated_at && {
                nextGeneratedAt: item.next_generated_at,
            }),
        })),
        suggestions:
            dismissed.has(V1_SUGGESTION_ID) || alreadyConfigured
                ? []
                : [
                      {
                          id: V1_SUGGESTION_ID,
                          definitionId: V1_TASK_DEFINITION.id,
                          definition: V1_TASK_DEFINITION,
                          reason: V1_TASK_DEFINITION.suggestedReason,
                          dismissed: false,
                      },
                  ],
    };
}
