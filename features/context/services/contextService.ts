import type { SupabaseClient } from '@supabase/supabase-js';
import type {
    ContextEntry,
    ContextEntryRow,
    UpsertEntryPayload,
} from '@/features/context/types/context';
import { rowToEntry } from '@/features/context/types/context';

export async function listEntries(
    db: SupabaseClient,
    userId: string,
): Promise<ContextEntry[]> {
    const { data, error } = await db
        .from('context_entries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as ContextEntryRow[]).map(rowToEntry);
}

export async function upsertEntry(
    db: SupabaseClient,
    userId: string,
    payload: UpsertEntryPayload,
): Promise<ContextEntry> {
    const now = new Date().toISOString();
    const record = {
        user_id: userId,
        entity_id: payload.entityId,
        entry_type: payload.entryType,
        label: payload.label,
        data: payload.data ?? {},
        linked_to: payload.linkedTo ?? [],
        updated_at: now,
    };
    const { data, error } = await db
        .from('context_entries')
        .upsert(record, { onConflict: 'user_id,entity_id' })
        .select()
        .single();
    if (error) throw new Error(error.message);
    return rowToEntry(data as unknown as ContextEntryRow);
}

export async function batchUpsertEntries(
    db: SupabaseClient,
    userId: string,
    payloads: UpsertEntryPayload[],
): Promise<void> {
    if (payloads.length === 0) return;
    const now = new Date().toISOString();
    const records = payloads.map((p) => ({
        user_id: userId,
        entity_id: p.entityId,
        entry_type: p.entryType,
        label: p.label,
        data: p.data ?? {},
        linked_to: p.linkedTo ?? [],
        updated_at: now,
    }));
    const { error } = await db
        .from('context_entries')
        .upsert(records, { onConflict: 'user_id,entity_id' });
    if (error) throw new Error(error.message);
}

export async function deleteEntry(
    db: SupabaseClient,
    userId: string,
    entityId: string,
): Promise<void> {
    const { error } = await db
        .from('context_entries')
        .delete()
        .eq('user_id', userId)
        .eq('entity_id', entityId);
    if (error) throw new Error(error.message);
}
