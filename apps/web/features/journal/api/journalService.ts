import { supabase } from '@/lib/db/supabase';

export const journalService = {
    async createEntry(
        userId: string,
        title: string,
        content: string,
        type: 'journal' | 'document' | 'note' = 'journal',
    ) {
        return supabase
            .from('journals')
            .insert([{ title: title.trim(), content, user_id: userId, type }])
            .select()
            .single();
    },

    async updateEntry(
        userId: string,
        entryId: string,
        title: string,
        content: string,
    ) {
        return supabase
            .from('journals')
            .update({
                title: title.trim(),
                content,
                updated_at: new Date().toISOString(),
            })
            .eq('id', entryId)
            .eq('user_id', userId);
    },

    async deleteEntry(userId: string, entryId: string) {
        return supabase
            .from('journals')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', entryId)
            .eq('user_id', userId);
    },
};
