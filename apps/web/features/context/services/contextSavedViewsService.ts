import type { SupabaseClient } from '@supabase/supabase-js';
import {
    contextSavedViewInputSchema,
    type ContextSavedView,
    type ContextSavedViewInput,
} from '@/features/context/types/schemas';

const SELECT =
    'id,user_id,name,filters,layout_mode,focus_node,viewport,visible_node_types,visible_edge_kinds,created_at,updated_at';

function rowToSavedView(row: Record<string, any>): ContextSavedView {
    return {
        id: row.id,
        userId: row.user_id,
        name: row.name,
        filters: row.filters ?? {},
        layoutMode: row.layout_mode,
        focusNode: row.focus_node,
        viewport: row.viewport ?? {},
        visibleNodeTypes: row.visible_node_types ?? [],
        visibleEdgeKinds: row.visible_edge_kinds ?? [],
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export async function listContextSavedViews(
    db: SupabaseClient,
    userId: string,
): Promise<ContextSavedView[]> {
    const { data, error } = await (db as any)
        .from('context_saved_views')
        .select(SELECT)
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as Record<string, any>[]).map(rowToSavedView);
}

export async function saveContextView(
    db: SupabaseClient,
    userId: string,
    input: ContextSavedViewInput & { id?: string },
): Promise<ContextSavedView> {
    const parsed = contextSavedViewInputSchema.parse(input);
    const record = {
        ...(input.id ? { id: input.id } : {}),
        user_id: userId,
        name: parsed.name,
        filters: parsed.filters,
        layout_mode: parsed.layoutMode,
        focus_node: parsed.focusNode,
        viewport: parsed.viewport,
        visible_node_types: parsed.visibleNodeTypes,
        visible_edge_kinds: parsed.visibleEdgeKinds,
        updated_at: new Date().toISOString(),
    };
    const { data, error } = await (db as any)
        .from('context_saved_views')
        .upsert(record)
        .select(SELECT)
        .single();
    if (error) throw new Error(error.message);
    return rowToSavedView(data);
}

export async function deleteContextSavedView(
    db: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const { error } = await (db as any)
        .from('context_saved_views')
        .delete()
        .eq('user_id', userId)
        .eq('id', id);
    if (error) throw new Error(error.message);
}
