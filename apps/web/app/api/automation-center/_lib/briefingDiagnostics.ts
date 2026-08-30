import type { SupabaseClient } from '@supabase/supabase-js';

export interface BriefingDiagnostic {
    status: string;
    warnings: string[];
    failureDetail: string | null;
}

interface BriefingRow {
    job_id: string;
    status: string;
    warnings: string[] | null;
    failure_detail: string | null;
}

export async function loadBriefingDiagnostics(
    db: SupabaseClient,
    userId: string,
): Promise<Map<string, BriefingDiagnostic>> {
    const result = await db
        .from('briefings')
        .select('job_id,status,warnings,failure_detail')
        .eq('user_id', userId)
        .not('job_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(100);
    if (result.error) return new Map<string, BriefingDiagnostic>();
    return new Map<string, BriefingDiagnostic>(
        ((result.data ?? []) as BriefingRow[]).map((row) => [
            String(row.job_id),
            {
                status: row.status,
                warnings: row.warnings ?? [],
                failureDetail: row.failure_detail,
            },
        ]),
    );
}
