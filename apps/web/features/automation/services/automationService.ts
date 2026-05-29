import { db } from '@/lib/db/supabase';
import type {
    AutomationApproval,
    AutomationConfig,
    AutomationDefinition,
    AutomationDeliverable,
    AutomationInstance,
    AutomationRunRecord,
    AutomationSchedule,
    AutomationSuggestion,
    AutomationWidgetProfile,
} from '@/features/automation/types/automation';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function listAutomationConfigs(userId: string) {
    const result = await db
        .from('automation_configs')
        .select('*')
        .eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []) as AutomationConfig[];
}

export async function createAutomationConfig(
    config: Omit<AutomationConfig, 'id'>,
) {
    const result = await db
        .from('automation_configs')
        .insert({
            user_id: config.userId,
            name: config.name,
            trigger_type: config.triggerType,
            condition_types: config.conditionTypes,
            action_types: config.actionTypes,
            state: config.state,
            requires_approval: config.requiresApproval,
            service_requirements: config.serviceRequirements,
            consent_requirements: config.consentRequirements,
            schedule: config.schedule,
        })
        .select()
        .single();
    if (result.error) throw result.error;
    return result.data as AutomationConfig;
}

export async function listAutomationConfigsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('automation_configs')
        .select('*')
        .eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []) as AutomationConfig[];
}

export async function logAutomationRun(
    supabase: SupabaseClient,
    userId: string,
    automationConfigId: string,
    status = 'queued',
) {
    const result = await supabase
        .from('automation_runs')
        .insert({
            user_id: userId,
            automation_config_id: automationConfigId,
            status,
        })
        .select()
        .single();
    if (result.error) throw result.error;
    return result.data as unknown;
}

// ─── Automation Center service ─────────────────────────────────────────────────

export function listAutomationDefinitions(): Promise<AutomationDefinition[]> {
    return Promise.resolve([]);
}

export function listUserAutomations(
    _userId: string,
): Promise<AutomationInstance[]> {
    return Promise.resolve([]);
}

export function toggleAutomation(_id: string, _enabled: boolean): Promise<void> {
    return Promise.resolve();
}

export function createAutomation(_config: {
    userId: string;
    definitionId: string;
}): Promise<AutomationInstance> {
    return Promise.reject(new Error('Not implemented'));
}

export function updateAutomation(
    _id: string,
    _patch: Partial<AutomationInstance>,
): Promise<AutomationInstance> {
    return Promise.reject(new Error('Not implemented'));
}

export function deleteAutomation(_id: string): Promise<void> {
    return Promise.resolve();
}

export function listAutomationRuns(
    _userId: string,
): Promise<AutomationRunRecord[]> {
    return Promise.resolve([]);
}

export function listPendingApprovals(
    _userId: string,
): Promise<AutomationApproval[]> {
    return Promise.resolve([]);
}

export function approveAutomationRun(_id: string): Promise<void> {
    return Promise.resolve();
}

export function rejectAutomationRun(_id: string): Promise<void> {
    return Promise.resolve();
}

export function listScheduledDeliverables(
    _userId: string,
): Promise<AutomationDeliverable[]> {
    return Promise.resolve([]);
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
}): Promise<AutomationDeliverable> {
    return Promise.resolve({
        id: config.id ?? `deliv-${Math.random().toString(36).slice(2)}`,
        userId: config.userId,
        name: config.name,
        sourceWidgets: config.sourceWidgets,
        outputType: config.outputType,
        schedule: config.schedule,
        deliveryDestination: config.deliveryDestination,
        approvalMode: config.approvalMode,
        enabled: config.enabled,
    });
}

export function getWidgetAutomationProfile(
    _widgetId: string,
): AutomationWidgetProfile | undefined {
    return undefined;
}

export function listSuggestions(
    _userId: string,
): Promise<AutomationSuggestion[]> {
    return Promise.resolve([]);
}

export function dismissSuggestion(_id: string): Promise<void> {
    return Promise.resolve();
}
