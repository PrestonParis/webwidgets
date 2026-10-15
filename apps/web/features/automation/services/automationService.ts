import { db } from '@/lib/db/supabase';
import type { AutomationConfig } from '@/features/automation/types/automation';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { publishActivityEventSafe } from '@/features/activity/services/activityService';
import { omitUndefined } from '@/features/backend/lib/exactOptional';
import { buildContextBundleForAutomation } from '@/features/context/services/contextBundleService';
import { ingestAutomationRunContext } from '@/features/context/services/contextProducerService';

export async function listAutomationConfigs(userId: string) {
    const result = await db
        .from('automation_configs')
        .select('*')
        .eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []) as unknown as AutomationConfig[];
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
    supabase: SupabaseClient<Database>,
    userId: string,
) {
    const result = await supabase
        .from('automation_configs')
        .select('*')
        .eq('user_id', userId);
    if (result.error) throw result.error;
    return (result.data ?? []) as unknown as AutomationConfig[];
}

export async function logAutomationRun(
    supabase: SupabaseClient<Database>,
    userId: string,
    automationConfigId: string,
    status = 'queued',
) {
    const contextBundle = await buildContextBundleForAutomation(
        supabase,
        userId,
        automationConfigId,
        { maxNodes: 20, maxPromptChars: 3000 },
    ).catch(() => null);
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
    const run = result.data as unknown;
    await ingestAutomationRunContext(
        supabase,
        userId,
        omitUndefined({
            automationConfigId,
            runId:
                typeof run === 'object' && run && 'id' in run
                    ? String((run as { id: unknown }).id)
                    : undefined,
            status,
        }),
    ).catch(() => undefined);

    // Publish activity event for terminal statuses
    if (status === 'completed') {
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'automation',
            eventType: 'automation.executed',
            sourceId: automationConfigId,
            sourceTable: 'automation_configs',
            category: 'automation',
            severity: 'success',
            priority: 'normal',
            title: 'Automation executed',
            metadata: {
                automationConfigId,
                runStatus: status,
                contextNodeCount: contextBundle?.nodes.length ?? 0,
            },
        });
    } else if (status === 'failed') {
        await publishActivityEventSafe(supabase, {
            userId,
            source: 'automation',
            eventType: 'automation.failed',
            sourceId: automationConfigId,
            sourceTable: 'automation_configs',
            category: 'automation',
            severity: 'critical',
            priority: 'high',
            title: 'Automation failed',
            metadata: {
                automationConfigId,
                runStatus: status,
                contextNodeCount: contextBundle?.nodes.length ?? 0,
            },
        });
    }

    return run;
}
