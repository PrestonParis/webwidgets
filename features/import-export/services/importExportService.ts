import { db } from '@/lib/db/supabase';
import type { ImportJob } from '@/features/import-export/types/importExport';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function listImportJobs(userId: string) {
    const { data, error } = await db
        .from('import_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ImportJob[];
}

export async function listImportJobsForUser(
    supabase: SupabaseClient,
    userId: string,
) {
    const result = await supabase
        .from('import_jobs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    if (result.error) throw result.error;
    return (result.data ?? []) as ImportJob[];
}
