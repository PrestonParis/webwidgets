import { V1_SUGGESTION_ID, V1_TASK_DEFINITION } from './fixture';
import type { BriefingDiagnostic } from './briefingDiagnostics';
import {
    V1_TEMPLATE_IDS,
    v1TemplateDefinition,
} from '@/features/automation/lib/v1TemplateCatalog';

export interface ConfigRow {
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
    approval_mode: string;
}

export interface RunRow {
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
    job_id: string | null;
}

export interface RequestRow {
    automation_run_id: string;
    payload: Record<string, unknown>;
    requested_at: string;
    payload_version: number;
    payload_hash: string;
    action_id: string;
}

export interface DeliverableRow {
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

function recordValue(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
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

export function mapInstances(configs: ConfigRow[]) {
    return configs.map((config) => {
        const schedule = recordValue(config.config['schedule']);
        return {
            id: config.id,
            userId: config.user_id,
            definitionId: config.definition_id ?? V1_TASK_DEFINITION.id,
            definition: {
                ...(v1TemplateDefinition(config.definition_id ?? '') ??
                    V1_TASK_DEFINITION),
                name: config.name,
            },
            status: centerStatus(config.state),
            enabled: config.state === 'enabled',
            ...(config.last_triggered_at && {
                lastRunAt: config.last_triggered_at,
            }),
            ...(config.next_run_at && { nextRunAt: config.next_run_at }),
            approvalRequired: config.approval_mode === 'always',
            dryRun: config.state === 'dry_run',
            ...(typeof schedule['localTime'] === 'string' && {
                localTime: schedule['localTime'],
            }),
            ...(typeof schedule['timezone'] === 'string' && {
                timezone: schedule['timezone'],
            }),
            createdAt: config.created_at,
            updatedAt: config.updated_at,
        };
    });
}

export function mapHistory(
    runs: RunRow[],
    names: Map<string, string>,
    diagnostics: Map<string, BriefingDiagnostic>,
) {
    return runs.map((run) => {
        const diagnostic = run.job_id ? diagnostics.get(run.job_id) : undefined;
        const summary = textValue(
            run.evaluation['reason'],
            run.status,
        ).replaceAll('_', ' ');
        return {
            id: run.id,
            userId: run.user_id,
            instanceId: run.automation_config_id ?? '',
            automationName:
                names.get(run.automation_config_id ?? '') ??
                'Archived automation',
            widgetName: 'Tasks',
            status: runStatus(run.status),
            triggeredBy: textValue(run.trigger_payload['type'], 'manual'),
            startedAt: run.started_at ?? run.created_at,
            ...(run.completed_at && { completedAt: run.completed_at }),
            ...((run.failure_detail ?? diagnostic?.failureDetail) && {
                errorMessage:
                    run.failure_detail ?? diagnostic?.failureDetail ?? '',
            }),
            ...(diagnostic?.warnings.length && {
                warnings: diagnostic.warnings,
            }),
            approvalStatus:
                run.approval_state === 'denied'
                    ? 'rejected'
                    : run.approval_state,
            triggerInput: run.trigger_payload,
            actionsAttempted: [
                textValue(run.evaluation['actionId'], 'bounded_template'),
            ],
            ...(Object.keys(run.action_payload).length > 0 && {
                outputGenerated: JSON.stringify(run.action_payload),
            }),
            summary: `${summary}${diagnostic?.status === 'partial' ? ' · partial source coverage' : ''}`,
        };
    });
}

export function mapApprovals(
    requests: RequestRow[],
    runMap: Map<string, RunRow>,
    names: Map<string, string>,
) {
    return requests.map((request) => {
        const run = runMap.get(request.automation_run_id);
        const payload = request.payload;
        const calendar = request.action_id === 'calendar.create_event';
        return {
            id: request.automation_run_id,
            runId: request.automation_run_id,
            automationName:
                names.get(run?.automation_config_id ?? '') ?? 'Task automation',
            proposedAction: calendar
                ? `Create event: ${textValue(payload['title'], 'Untitled')}`
                : `Create task: ${textValue(payload['title'], 'Untitled')}`,
            outputPreview: calendar
                ? `${textValue(payload['startsAt'])} – ${textValue(payload['endsAt'])}`
                : textValue(payload['notes']),
            ...(calendar && {
                externalEffectWarning:
                    'This writes the exact reviewed event to Google Calendar.',
            }),
            createdAt: request.requested_at,
            widgetName: calendar ? 'Calendar' : 'Tasks',
            payloadVersion: Number(request.payload_version),
            payloadHash: request.payload_hash,
        };
    });
}

export function mapDeliverables(items: DeliverableRow[]) {
    return items.map((item) => ({
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
    }));
}

export function mapSuggestions(configs: ConfigRow[], dismissedIds: string[]) {
    const configured = new Set(configs.map((config) => config.definition_id));
    const dismissed = new Set(dismissedIds);
    const suggestions = V1_TEMPLATE_IDS.filter(
        (id) => !dismissed.has(`suggestion:${id}`) && !configured.has(id),
    ).map((id) => {
        const definition = v1TemplateDefinition(id);
        return {
            id: `suggestion:${id}`,
            definitionId: id,
            definition,
            reason: definition.suggestedReason ?? definition.description,
            dismissed: false,
        };
    });
    if (suggestions.length > 0) return suggestions;
    if (
        dismissed.has(V1_SUGGESTION_ID) ||
        configured.has(V1_TASK_DEFINITION.id)
    )
        return [];
    return [
        {
            id: V1_SUGGESTION_ID,
            definitionId: V1_TASK_DEFINITION.id,
            definition: V1_TASK_DEFINITION,
            reason: V1_TASK_DEFINITION.suggestedReason ?? '',
            dismissed: false,
        },
    ];
}
