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

export const countdownAdapter: ImportExportAdapter = {
    id: 'countdowns',
    displayName: 'Countdowns',
    description: 'Countdown timers: import/export your countdown events',
    sourceType: 'countdowns',
    canImport: true,
    canExport: true,
    canProvideContext: false,
    importFormats: ['csv', 'json'],
    exportFormats: ['csv', 'json'],

    async checkAvailability(): Promise<AdapterAvailability> {
        try {
            const { supabase } = await createClients();
            const { error } = await supabase
                .from('countdowns')
                .select('id')
                .limit(1);
            if (error) {
                if (isMissingTableError(error)) {
                    return {
                        available: false,
                        message: 'countdowns table not found',
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
            .from('countdowns')
            .select('id, name, target_date, emoji')
            .eq('user_id', userId)
            .order('target_date', { ascending: true });

        if (options?.limit) query = query.limit(options.limit);

        const { data, error } = await query;
        if (error) {
            if (isMissingTableError(error)) {
                warnings.push('countdowns table not configured');
                return { rows: [], totalCount: 0, warnings };
            }
            throw error;
        }

        const rows: MappedRow[] = (data ?? []).map((row, i) => ({
            rowIndex: i,
            data: {
                id: row.id,
                name: row.name ?? '',
                target_date: row.target_date ?? '',
                emoji: row.emoji ?? '',
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
                "'merge' strategy not fully implemented, using 'overwrite' behavior",
            );
        }

        for (const row of rows) {
            try {
                const d = row.data as Record<string, unknown>;

                if (!d['name']) {
                    errors.push({
                        rowIndex: row.rowIndex,
                        message: 'Missing required field: name',
                    });
                    errorCount++;
                    continue;
                }

                if (!d['target_date']) {
                    errors.push({
                        rowIndex: row.rowIndex,
                        message: 'Missing required field: target_date',
                    });
                    errorCount++;
                    continue;
                }

                // Duplicate = same name (case-insensitive)
                if (strategy === 'skip') {
                    const { data: existing } = await supabase
                        .from('countdowns')
                        .select('id')
                        .eq('user_id', userId)
                        .ilike('name', String(d['name']))
                        .single();
                    if (existing) {
                        warnings.push(
                            `Row ${row.rowIndex}: skipped existing countdown (name=${String(d['name'])})`,
                        );
                        continue;
                    }
                }

                const record = {
                    user_id: userId,
                    name: String(d['name']).trim(),
                    target_date: String(d['target_date']),
                    emoji: d['emoji'] ? String(d['emoji']) : '⏳',
                };

                const { error } = await supabase
                    .from('countdowns')
                    .insert(record);
                if (error) throw error;
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
