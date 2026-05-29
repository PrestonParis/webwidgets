import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    MappedRow,
} from '@/features/import-export/types/importExport';

export const recoveryAdapter: ImportExportAdapter = {
    id: 'recovery_records',
    displayName: 'Recovery',
    description: 'Recovery trackers — export your sobriety tracker profiles',
    sourceType: 'recovery_records',
    canImport: false,
    canExport: true,
    canProvideContext: false,
    importFormats: [],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('recovery_profiles')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'recovery_profiles table not found',
                    };
                }
                return { available: false, message: error.message };
            }
            return { available: true };
        } catch (e) {
            return {
                available: false,
                message: e instanceof Error ? e.message : 'Unknown error',
            };
        }
    },

    async exportData(
        userId: string,
        options?: ExportOptions,
    ): Promise<ExportResult> {
        const { supabase } = await createClients();
        const warnings: string[] = [];

        let query = supabase
            .from('recovery_profiles')
            .select('id, name, addiction, start_time, category, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

        if (options?.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) {
                warnings.push('recovery_profiles table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw error;
        }

        const profiles = (data ?? []) as {
            id: string;
            name: string | null;
            addiction: string | null;
            start_time: string | null;
            category: string | null;
            created_at: string | null;
        }[];

        if (profiles.length === 0) {
            return { rows: [], totalCount: 0, warnings };
        }

        // Fetch the latest relapse per tracker to get the authoritative start_time.
        // recovery_profiles.start_time can be stale if the UPDATE policy was missing;
        // the most recent relapse record is the ground truth for the current streak.
        const trackerIds = profiles.map((p) => p.id);
        const { data: relapseData, error: relapseError } = await supabase
            .from('relapses')
            .select('tracker_id, relapsed_at')
            .in('tracker_id', trackerIds)
            .order('relapsed_at', { ascending: false });

        if (relapseError && !isMissingTableError(relapseError)) {
            warnings.push(
                `Could not fetch relapse data: ${relapseError.message}`,
            );
        }

        const latestRelapse = new Map<string, string>();
        for (const r of (relapseData ?? []) as {
            tracker_id: string;
            relapsed_at: string;
        }[]) {
            if (!latestRelapse.has(r.tracker_id)) {
                latestRelapse.set(r.tracker_id, r.relapsed_at);
            }
        }

        const rows: MappedRow[] = profiles
            .filter((p) => p.addiction !== null && p.start_time !== null)
            .map((p, i) => ({
                rowIndex: i,
                data: {
                    id: p.id,
                    // Use the most recent relapse as start_time if it exists,
                    // otherwise fall back to the profile's recorded start_time.
                    start_time: latestRelapse.get(p.id) ?? p.start_time ?? '',
                    addiction: p.addiction ?? '',
                    name: p.name ?? '',
                    category: p.category ?? '',
                    created_at: p.created_at ?? '',
                },
            }));

        return { rows, totalCount: rows.length, warnings };
    },
};
