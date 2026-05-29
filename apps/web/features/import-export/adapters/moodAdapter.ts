import { createClients } from '@/lib/supabase/serverClient';
import { isMissingTableError } from '@/lib/supabase/missingTable';
import type { ImportExportAdapter } from '@/features/import-export/lib/adapterInterface';
import type {
    AdapterAvailability,
    ExportOptions,
    ExportResult,
    ImportExecutionResult,
    MappedRow,
    DuplicateStrategy,
} from '@/features/import-export/types/importExport';

export const moodAdapter: ImportExportAdapter = {
    id: 'mood_logs',
    displayName: 'Mood Logs',
    description: 'Daily mood tracking — import/export your mood log history',
    sourceType: 'mood_logs',
    canImport: true,
    canExport: true,
    canProvideContext: false,
    importFormats: ['csv', 'json'],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('mood_logs')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'mood_logs table not found',
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
            .from('mood_logs')
            .select('id, mood, note, logged_date, logged_at')
            .eq('user_id', userId)
            .order('logged_date', { ascending: false });

        if (options?.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) {
                warnings.push('mood_logs table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw error;
        }

        const rows: MappedRow[] = (data ?? []).map((row, i) => ({
            rowIndex: i,
            data: {
                id: row.id,
                mood: row.mood,
                note: row.note ?? '',
                logged_date: row.logged_date ?? '',
                logged_at: row.logged_at ?? '',
            },
        }));

        return { rows, totalCount: rows.length, warnings };
    },

    async importData(
        userId: string,
        rows: MappedRow[],
        strategy: DuplicateStrategy,
    ): Promise<ImportExecutionResult> {
        const { supabase } = await createClients();
        let successCount = 0;
        let errorCount = 0;
        const errors: { rowIndex: number; message: string }[] = [];
        const warnings: string[] = [];

        if (strategy === 'merge') {
            warnings.push(
                "'merge' strategy not fully implemented — using 'overwrite' behavior",
            );
        }

        for (const row of rows) {
            try {
                const d = row.data as Record<string, unknown>;
                const logged_date = d['logged_date']
                    ? String(d['logged_date'])
                    : null;

                if (!d['mood'] && d['mood'] !== 0) {
                    errors.push({
                        rowIndex: row.rowIndex,
                        message: 'Missing required field: mood',
                    });
                    errorCount++;
                    continue;
                }

                if (!logged_date) {
                    errors.push({
                        rowIndex: row.rowIndex,
                        message: 'Missing required field: logged_date',
                    });
                    errorCount++;
                    continue;
                }

                // Duplicate = same user + same date
                if (strategy === 'skip') {
                    const { data: existing } = await supabase
                        .from('mood_logs')
                        .select('id')
                        .eq('user_id', userId)
                        .eq('logged_date', logged_date)
                        .single();
                    if (existing) {
                        warnings.push(
                            `Row ${row.rowIndex}: skipped existing mood log (logged_date=${logged_date})`,
                        );
                        continue;
                    }
                }

                const record = {
                    user_id: userId,
                    mood: Number(d['mood']),
                    note: d['note'] ? String(d['note']) : null,
                    logged_date,
                    logged_at: d['logged_at']
                        ? String(d['logged_at'])
                        : new Date().toISOString(),
                };

                if (strategy === 'overwrite' || strategy === 'merge') {
                    const { error } = await supabase
                        .from('mood_logs')
                        .upsert(record, { onConflict: 'user_id,logged_date' });
                    if (error) throw error;
                } else {
                    const { error } = await supabase
                        .from('mood_logs')
                        .insert(record);
                    if (error) throw error;
                }
                successCount++;
            } catch (e) {
                errors.push({
                    rowIndex: row.rowIndex,
                    message: e instanceof Error ? e.message : String(e),
                });
                errorCount++;
            }
        }

        return {
            successCount,
            errorCount,
            warningCount: warnings.length,
            errors,
            warnings,
        };
    },
};
