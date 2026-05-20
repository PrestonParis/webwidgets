import { db } from '@/lib/db/supabase';
import type { UserPreferences } from '@/features/personalization/types/personalization';

export async function fetchUserPreferences(userId: string) {
    const result = await db
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
    if (result.error) throw result.error;
    return (result.data as UserPreferences | null) ?? null;
}
