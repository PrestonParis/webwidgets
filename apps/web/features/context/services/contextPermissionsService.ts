import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import {
    DEFAULT_CONTEXT_PERMISSIONS,
    contextPermissionsSchema,
    type ContextPermissionCategory,
    type ContextPermissionSettings,
} from '@/features/context/types/schemas';

type PermissionRow = {
    capture_widget_interactions?: boolean;
    capture_chat_memory?: boolean;
    capture_files?: boolean;
    capture_documents?: boolean;
    capture_integrations?: boolean;
    allow_ai_personalization?: boolean;
    allow_automation_context_access?: boolean;
    allow_cross_widget_context?: boolean;
    allow_inferred_relationships?: boolean;
};

const toRow = (settings: Partial<ContextPermissionSettings>) => ({
    ...(settings.captureWidgetInteractions !== undefined
        ? { capture_widget_interactions: settings.captureWidgetInteractions }
        : {}),
    ...(settings.captureChatMemory !== undefined
        ? { capture_chat_memory: settings.captureChatMemory }
        : {}),
    ...(settings.captureFiles !== undefined
        ? { capture_files: settings.captureFiles }
        : {}),
    ...(settings.captureDocuments !== undefined
        ? { capture_documents: settings.captureDocuments }
        : {}),
    ...(settings.captureIntegrations !== undefined
        ? { capture_integrations: settings.captureIntegrations }
        : {}),
    ...(settings.allowAIPersonalization !== undefined
        ? { allow_ai_personalization: settings.allowAIPersonalization }
        : {}),
    ...(settings.allowAutomationContextAccess !== undefined
        ? {
              allow_automation_context_access:
                  settings.allowAutomationContextAccess,
          }
        : {}),
    ...(settings.allowCrossWidgetContext !== undefined
        ? { allow_cross_widget_context: settings.allowCrossWidgetContext }
        : {}),
    ...(settings.allowInferredRelationships !== undefined
        ? {
              allow_inferred_relationships: settings.allowInferredRelationships,
          }
        : {}),
});

export function rowToContextPermissions(
    row?: PermissionRow | null,
): ContextPermissionSettings {
    return contextPermissionsSchema.parse({
        captureWidgetInteractions:
            row?.capture_widget_interactions ??
            DEFAULT_CONTEXT_PERMISSIONS.captureWidgetInteractions,
        captureChatMemory:
            row?.capture_chat_memory ??
            DEFAULT_CONTEXT_PERMISSIONS.captureChatMemory,
        captureFiles:
            row?.capture_files ?? DEFAULT_CONTEXT_PERMISSIONS.captureFiles,
        captureDocuments:
            row?.capture_documents ??
            DEFAULT_CONTEXT_PERMISSIONS.captureDocuments,
        captureIntegrations:
            row?.capture_integrations ??
            DEFAULT_CONTEXT_PERMISSIONS.captureIntegrations,
        allowAIPersonalization:
            row?.allow_ai_personalization ??
            DEFAULT_CONTEXT_PERMISSIONS.allowAIPersonalization,
        allowAutomationContextAccess:
            row?.allow_automation_context_access ??
            DEFAULT_CONTEXT_PERMISSIONS.allowAutomationContextAccess,
        allowCrossWidgetContext:
            row?.allow_cross_widget_context ??
            DEFAULT_CONTEXT_PERMISSIONS.allowCrossWidgetContext,
        allowInferredRelationships:
            row?.allow_inferred_relationships ??
            DEFAULT_CONTEXT_PERMISSIONS.allowInferredRelationships,
    });
}

export async function getContextPermissions(
    db: SupabaseClient<Database>,
    userId: string,
): Promise<ContextPermissionSettings> {
    const { data, error } = await db
        .from('context_permissions')
        .select(
            'capture_widget_interactions,capture_chat_memory,capture_files,capture_documents,capture_integrations,allow_ai_personalization,allow_automation_context_access,allow_cross_widget_context,allow_inferred_relationships',
        )
        .eq('user_id', userId)
        .maybeSingle();
    if (error) {
        if (isMissingTableError(error)) return DEFAULT_CONTEXT_PERMISSIONS;
        throw new Error(error.message);
    }
    return rowToContextPermissions(data);
}

export async function upsertContextPermissions(
    db: SupabaseClient<Database>,
    userId: string,
    input: Partial<ContextPermissionSettings>,
): Promise<ContextPermissionSettings> {
    const current = await getContextPermissions(db, userId);
    const next = contextPermissionsSchema.parse({ ...current, ...input });
    const { data, error } = await db
        .from('context_permissions')
        .upsert(
            {
                user_id: userId,
                ...toRow(next),
                updated_at: new Date().toISOString(),
            },
            { onConflict: 'user_id' },
        )
        .select(
            'capture_widget_interactions,capture_chat_memory,capture_files,capture_documents,capture_integrations,allow_ai_personalization,allow_automation_context_access,allow_cross_widget_context,allow_inferred_relationships',
        )
        .single();
    if (error) throw new Error(error.message);
    return rowToContextPermissions(data);
}

export function permissionAllowsCapture(
    permissions: ContextPermissionSettings,
    category: ContextPermissionCategory,
): boolean {
    return permissions[category] !== false;
}

export function captureCategoryForSource(
    sourceType?: string,
): ContextPermissionCategory {
    if (sourceType === 'widget' || sourceType === 'widget_interaction')
        return 'captureWidgetInteractions';
    if (sourceType === 'chat' || sourceType === 'query_gist')
        return 'captureChatMemory';
    if (sourceType === 'file' || sourceType === 'files') return 'captureFiles';
    if (
        sourceType === 'document' ||
        sourceType === 'documents' ||
        sourceType === 'journals'
    )
        return 'captureDocuments';
    if (
        sourceType?.includes('integration') ||
        sourceType === 'calendar_events' ||
        sourceType === 'email' ||
        sourceType === 'gmail' ||
        sourceType === 'email_actions'
    )
        return 'captureIntegrations';
    if (sourceType === 'automation_configs' || sourceType === 'automation_runs')
        return 'allowAutomationContextAccess';
    return 'allowCrossWidgetContext';
}
