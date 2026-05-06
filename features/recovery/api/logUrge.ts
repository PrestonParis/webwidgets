import { supabase } from '@/lib/db/supabase';

export async function logUrge(
    trackerId: string,
    trigger: string,
    intensity: number,
) {
    return supabase.from('urges').insert({
        trigger,
        intensity,
        tracker_id: trackerId,
    });
}
