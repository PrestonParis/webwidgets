import { supabase } from '@/lib/db/supabase';

export const journalService = {
    async createEntry(userId: string, title: string, content: string) {
        return supabase
            .from('journals')
            .insert([{ title: title.trim(), content, user_id: userId }]);
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
};
