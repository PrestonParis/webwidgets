import { supabase } from '@/lib/db/supabase';

export async function fetchRelapses(trackerId: string): Promise<string[]> {
    const { data } = await supabase
        .from('relapses')
        .select('relapsed_at')
        .eq('tracker_id', trackerId);
    return (data ?? []).map((r) => r.relapsed_at.split('T')[0]);
}
