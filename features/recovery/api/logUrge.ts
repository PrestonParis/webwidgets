import { supabase } from '@/lib/db/supabase';

export async function logUrge(trackerId: string, trigger: string) {
    return supabase.from('urges').insert({
        trigger,
        intensity: 5,
        tracker_id: trackerId,
    });
}
