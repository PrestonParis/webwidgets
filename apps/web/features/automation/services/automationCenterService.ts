import type {
    AutomationApproval,
    AutomationDeliverable,
    AutomationInstance,
    AutomationRunRecord,
    AutomationSchedule,
    AutomationSuggestion,
    AutomationWidgetProfile,
} from '@/features/automation/types/automation';
import { apiRouteFetch } from '@/lib/api/client';
import { cachedJson, clearCachedJson } from '@/lib/api/requestCache';

const CENTER_PATH = '/api/automation-center';

interface AutomationCenterSnapshot {
    globalEnabled: boolean;
    instances: AutomationInstance[];
    runs: AutomationRunRecord[];
    approvals: AutomationApproval[];
    deliverables: AutomationDeliverable[];
    suggestions: AutomationSuggestion[];
}

async function centerCommand(body: Record<string, unknown>) {
    const response = await apiRouteFetch(CENTER_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error('Automation command failed');
    clearCachedJson(CENTER_PATH);
    return response.json() as Promise<unknown>;
}

export function getAutomationCenterSnapshot() {
    return cachedJson<AutomationCenterSnapshot>(CENTER_PATH, { ttlMs: 5_000 });
}

export function toggleAutomation(id: string, enabled: boolean) {
    return centerCommand({ command: 'set_state', id, enabled }).then(
        () => undefined,
    );
}

export function createAutomation(config: {
    userId: string;
    definitionId: string;
}) {
    if (config.definitionId === 'v1.create-task')
        return centerCommand({ command: 'create_fixture' });
    return centerCommand({
        command: 'create_template',
        definitionId: config.definitionId,
        localTime: '09:00',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        dryRun: true,
    });
}

export function configureAutomation(
    id: string,
    config: { localTime: string; timezone: string; dryRun: boolean },
) {
    return centerCommand({ command: 'configure', id, ...config }).then(
        () => undefined,
    );
}

export function updateAutomation(
    id: string,
    patch: Partial<AutomationInstance>,
) {
    if (patch.enabled === undefined)
        return Promise.reject(new Error('Unsupported automation update'));
    return centerCommand({ command: 'set_state', id, enabled: patch.enabled });
}

export function deleteAutomation(id: string) {
    return centerCommand({ command: 'archive', id }).then(() => undefined);
}

function decideAutomationRun(
    approval: AutomationApproval,
    decision: 'approved' | 'denied',
) {
    return centerCommand({
        command: 'decide',
        id: approval.runId,
        decision,
        payloadVersion: approval.payloadVersion,
        payloadHash: approval.payloadHash,
    }).then(() => undefined);
}

export function approveAutomationRun(approval: AutomationApproval) {
    return decideAutomationRun(approval, 'approved');
}

export function rejectAutomationRun(approval: AutomationApproval) {
    return decideAutomationRun(approval, 'denied');
}

export function upsertScheduledDeliverable(config: {
    userId: string;
    name: string;
    sourceWidgets: string[];
    outputType: AutomationDeliverable['outputType'];
    schedule: AutomationSchedule;
    deliveryDestination: AutomationDeliverable['deliveryDestination'];
    approvalMode: AutomationDeliverable['approvalMode'];
    enabled: boolean;
    id?: string;
}) {
    return centerCommand({
        command: 'upsert_deliverable',
        ...config,
    }) as Promise<AutomationDeliverable>;
}

export function getWidgetAutomationProfile(
    widgetId: string,
): AutomationWidgetProfile | undefined {
    if (widgetId !== 'tasks') return undefined;
    return {
        widgetId: 'tasks',
        widgetName: 'Tasks',
        emoji: '✅',
        availableTriggers: ['manual', 'scheduled'],
        availableActions: ['add_item'],
        providersRequired: [],
        safeLocalActions: [],
        approvalRequiredActions: ['add_item'],
        defaultEnabled: false,
    };
}

export function dismissSuggestion(id: string) {
    return centerCommand({ command: 'dismiss', id }).then(() => undefined);
}

export function setAutomationPauseAll(enabled: boolean) {
    return centerCommand({ command: 'pause_all', enabled }).then(
        () => undefined,
    );
}

export function triggerAutomation(id: string, dryRun = false) {
    return centerCommand({ command: 'trigger', id, dryRun }).then(
        () => undefined,
    );
}

export function retryAutomationRun(id: string) {
    return centerCommand({ command: 'retry', id }).then(() => undefined);
}
