import { db } from '@/lib/db/supabase';
import type { AutomationConfig } from '@/features/automation/types/automation';
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
