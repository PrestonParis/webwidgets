import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import { omitUndefined } from '@/features/backend/lib/exactOptional';
import {
    contextSavedViewInputSchema,
    type ContextSavedView,
    type ContextSavedViewInput,
} from '@/features/context/types/schemas';

type SavedViewRow = Database['public']['Tables']['context_saved_views']['Row'];

function rowToSavedView(row: SavedViewRow): ContextSavedView {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        filters: (row.filters as Record<string, unknown>) ?? {},
        layoutMode: row.layout_mode,
        focusNode: row.focus_node,
        viewport: (row.viewport as Record<string, unknown>) ?? {},
        visibleNodeTypes:
            (row.visible_node_types as ContextSavedView['visibleNodeTypes']) ??
            [],
        visibleEdgeKinds:
            (row.visible_edge_kinds as ContextSavedView['visibleEdgeKinds']) ??
            [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function listContextSavedViews(
    db: SupabaseClient<Database>,
    userId: string,
): Promise<ContextSavedView[]> {
    const { data, error } = await db
        .from('context_saved_views')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map(rowToSavedView);
}

export async function saveContextView(
    db: SupabaseClient<Database>,
    userId: string,
    input: ContextSavedViewInput & { id?: string },
): Promise<ContextSavedView> {
    const parsed = contextSavedViewInputSchema.parse(input);
    const record = {
        ...(input.id ? { id: input.id } : {}),
        user_id: userId,
        name: parsed.name,
        filters: parsed.filters as Json,
        layout_mode: parsed.layoutMode,
        focus_node: parsed.focusNode,
        viewport: parsed.viewport as Json,
        visible_node_types: parsed.visibleNodeTypes,
        visible_edge_kinds: parsed.visibleEdgeKinds,
        updated_at: new Date().toISOString(),
    };
    const { data, error } = await db
        .from('context_saved_views')
        .upsert(omitUndefined(record))
        .select('*')
        .single();
    if (error) throw new Error(error.message);
    return rowToSavedView(data);
}

export async function deleteContextSavedView(
    db: SupabaseClient<Database>,
    userId: string,
    id: string,
): Promise<void> {
    const { error } = await db
        .from('context_saved_views')
        .delete()
        .eq('user_id', userId)
        .eq('id', id);
    if (error) throw new Error(error.message);
}
