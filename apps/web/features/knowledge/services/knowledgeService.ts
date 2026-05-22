import { db } from '@/lib/db/supabase';
import type { KnowledgeItem } from '@/features/knowledge/types/knowledge';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function listKnowledgeItems(userId: string) {
    const result = await db
        .from('knowledge_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return (result.data ?? []) as KnowledgeItem[];
}

export async function createKnowledgeItem(
    item: Omit<KnowledgeItem, 'id' | 'createdAt'>,
) {
    const result = await db
        .from('knowledge_items')
        .insert({
            user_id: item.userId,
            kind: item.kind,
            title: item.title,
            body: item.body,
            tags: item.tags,
            collection_ids: item.collectionIds,
            sources: item.sources,
        })
        .select()
        .single();
    if (result.error) throw result.error;
    return result.data as KnowledgeItem;
}

export async function listKnowledgeItemsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return (result.data ?? []) as KnowledgeItem[];
}

export async function createKnowledgeItemForUser(
    supabase: SupabaseClient,
    item: Omit<KnowledgeItem, 'id' | 'createdAt'>,
) {
    const result = await supabase
        .from('knowledge_items')
        .insert({
            user_id: item.userId,
            kind: item.kind,
            title: item.title,
            body: item.body,
            tags: item.tags,
            collection_ids: item.collectionIds,
            sources: item.sources,
        })
        .select()
        .single();
    if (result.error) throw result.error;
    return result.data as KnowledgeItem;
}
